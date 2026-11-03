/* eslint-disable */
// Adaptive image formats at build time (npm dependencies only, no system binaries):
// 1. For every png/jpg/jpeg under source/images, generate sibling .jxl and .webp files.
//    Results are cached in node_modules/.cache/image-formats, keyed by content hash + encoder
//    params, so unchanged images are never re-encoded.
// 2. Wrap every <img> that points to such an image in a <picture>, so the browser picks the
//    first supported format in the order jxl -> webp -> original.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const IMG_DIR = "images";
const RAW_EXT = /\.(png|jpe?g)$/i;
// Order = priority of the <source> elements inside <picture>
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
  // Hexo's script sandbox has no dynamic import(), so the WASM encoder runs in a separate Node process
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
  const files = walk(root).filter((f) => RAW_EXT.test(f));
  const startedAt = Date.now();
  let encoded = 0;
  hexo.log.info(`image-formats: found ${files.length} images, encoding to ${FORMATS.map((f) => f.ext).join(", ")} (cached results are reused)`);
  for (const [index, file] of files.entries()) {
    const rel = "/" + IMG_DIR + "/" + path.relative(root, file).split(path.sep).join("/");
    const hash = crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex");
    const got = [];
    for (const fmt of FORMATS) {
      const cacheFile = path.join(CACHE_DIR, `${hash}.${fmt.params}.${fmt.ext}`);
      let buf = fs.existsSync(cacheFile) ? fs.readFileSync(cacheFile) : null;
      if (!buf) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
        hexo.log.info(`image-formats: [${index + 1}/${files.length}] ${fmt.ext} ${rel} (${elapsed}s elapsed)`);
        try {
          buf = await encoders[fmt.ext](file, cacheFile);
        } catch (e) {
          hexo.log.warn(`image-formats: failed to encode ${fmt.ext} for ${rel}: ${e.message}`);
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
  const total = ((Date.now() - startedAt) / 1000).toFixed(1);
  hexo.log.info(`image-formats: done, ${available.size}/${files.length} images available, ${encoded} newly encoded, ${total}s`);
  return routes;
});

const IMG_RE = /<img\b[^>]*>/gi;
const ATTR_RE = /\b(src|data-src)=("([^"]*)"|'([^']*)')/i;

hexo.extend.filter.register("after_render:html", (html) => {
  if (!available.size) return html;
  // Leave <img> elements that are already inside a <picture> alone
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
