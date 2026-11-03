// Usage: node tools/jxl-encode.mjs <input image> <output.jxl> [quality] [effort]
// Called by scripts/webp-picture.js. It lives in its own process because Hexo's script
// sandbox does not support dynamic import().
import fs from "node:fs";
import { createRequire } from "node:module";
import sharp from "sharp";
import encode, { init } from "@jsquash/jxl/encode.js";

const [input, output, quality = "80", effort = "4"] = process.argv.slice(2);
const require = createRequire(import.meta.url);
await init(await WebAssembly.compile(fs.readFileSync(require.resolve("@jsquash/jxl/codec/enc/jxl_enc.wasm"))));
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const out = await encode(
  { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height, colorSpace: "srgb" },
  { quality: Number(quality), effort: Number(effort) }
);
fs.writeFileSync(output, Buffer.from(out));
