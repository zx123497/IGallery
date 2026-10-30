// Generates small preview copies of every artwork in public/artworks.
// The 3D gallery loads these first and swaps in the original only when the
// visitor walks up to a painting or opens its detail view.
//
// Usage: npm run optimize:artworks
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = path.resolve("public/artworks");
const OUTPUT_DIR = path.join(SOURCE_DIR, "preview");
const PREVIEW_SIZE = 512;

await fs.mkdir(OUTPUT_DIR, {recursive: true});
const files = (await fs.readdir(SOURCE_DIR)).filter((file) => /\.(jpe?g|png|webp)$/i.test(file));

for (const file of files) {
  const output = path.join(OUTPUT_DIR, file.replace(/\.\w+$/, ".jpg"));
  const info = await sharp(path.join(SOURCE_DIR, file))
      .resize(PREVIEW_SIZE, PREVIEW_SIZE, {fit: "inside", withoutEnlargement: true})
      .jpeg({quality: 72, mozjpeg: true})
      .toFile(output);
  console.log(`${file} -> preview/${path.basename(output)} (${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB)`);
}
