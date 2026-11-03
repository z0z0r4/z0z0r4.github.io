/* eslint-disable */
// 构建时自动处理图片（只依赖 npm，不需要系统命令）：
// 1. 为 source/images 下的 png/jpg/jpeg 生成同名 .jxl 和 .webp
//    结果按「文件内容哈希 + 参数」缓存在 node_modules/.cache/image-formats，未改动的图不会重编
// 2. 把页面里指向这些图片的 <img> 自动包成 <picture>，浏览器按 jxl → webp → 原图 的顺序选第一个支持的
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const IMG_DIR = "images";
const RAW_EXT = /\.(png|jpe?g)$/i;
// 顺序即 <picture> 里 <source> 的优先级
const FORMATS = [
  { ext: "jxl", mime: "image/jxl", params: "q80e4" },
  { ext: "webp", mime: "image/webp", params: "q82" },
];
const CACHE_DIR = path.join("node_modules", ".cache", "image-formats");

const available = new Map(); // /images/a.png -> [{ext,mime}, ...]

const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
      )
    : [];

const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);
const JXL_TOOL = path.join(__dirname, "..", "tools", "jxl-encode.mjs");

const encoders = {
  // Hexo 脚本沙箱不支持动态 import，WASM 编码放到独立 Node 进程里做
  async jxl(file, cacheFile) {
    await execFileAsync(process.execPath, [JXL_TOOL, file, cacheFile, "80", "4"], { maxBuffer: 1 << 20 });
    return fs.readFileSync(cacheFile);
  },
  async webp(file) {
    return sharp(file).webp({ quality: 82 }).toBuffer();
  },
};

hexo.extend.generator.register("image-formats", async function () {
  const root = path.join(this.source_dir, IMG_DIR);
  available.clear();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const routes = [];
  let encoded = 0;
  for (const file of walk(root).filter((f) => RAW_EXT.test(f))) {
    const rel = "/" + IMG_DIR + "/" + path.relative(root, file).split(path.sep).join("/");
    const hash = crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex");
    const got = [];
    for (const fmt of FORMATS) {
      const cacheFile = path.join(CACHE_DIR, `${hash}.${fmt.params}.${fmt.ext}`);
      let buf = fs.existsSync(cacheFile) ? fs.readFileSync(cacheFile) : null;
      if (!buf) {
        try {
          buf = await encoders[fmt.ext](file, cacheFile);
        } catch (e) {
          hexo.log.warn(`${fmt.ext} 编码失败 ${rel}: ${e.message}`);
        }
        if (!buf) continue;
        fs.writeFileSync(cacheFile, buf);
        encoded++;
      }
      got.push(fmt);
      routes.push({ path: rel.slice(1).replace(RAW_EXT, "." + fmt.ext), data: buf });
    }
    if (got.length) available.set(rel, got);
  }
  hexo.log.info(`image-formats: ${available.size} 张图，新编码 ${encoded} 个文件`);
  return routes;
});

const IMG_RE = /<img\b[^>]*>/gi;
const ATTR_RE = /\b(src|data-src)=("([^"]*)"|'([^']*)')/i;

hexo.extend.filter.register("after_render:html", (html) => {
  if (!available.size) return html;
  // 已经在 <picture> 里的不再处理
  return html
    .split(/(<picture[\s\S]*?<\/picture>)/i)
    .map((part, i) => {
      if (i % 2) return part;
      return part.replace(IMG_RE, (tag) => {
        const m = tag.match(ATTR_RE);
        if (!m) return tag;
        const src = m[3] ?? m[4];
        let key;
        try { key = decodeURI(src.split(/[?#]/)[0]); } catch { return tag; }
        const fmts = available.get(key);
        if (!fmts) return tag;
        const attr = m[1].toLowerCase() === "data-src" ? "data-srcset" : "srcset";
        const sources = fmts
          .map((f) => `<source type="${f.mime}" ${attr}="${src.replace(RAW_EXT, "." + f.ext)}">`)
          .join("");
        return `<picture>${sources}${tag}</picture>`;
      });
    })
    .join("");
});
