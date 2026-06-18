import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const fypDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(fypDir, "Voice2Law-FYP2-Report.html"), "utf8");
const imgs = [...html.matchAll(/src="(images\/[^"]+)"/g)].map((m) => m[1]);
let ok = true;
for (const src of imgs) {
  const full = path.join(fypDir, src);
  const exists = fs.existsSync(full);
  console.log(`${exists ? "OK" : "MISSING"}  ${src}`);
  if (!exists) ok = false;
}
console.log(`\n${imgs.length} images referenced; ${ok ? "all present" : "some missing"}`);
