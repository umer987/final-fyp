/**
 * Capture Voice2Law UI screenshots for the FYP report.
 * Requires: frontend dev server on http://127.0.0.1:5173
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const imagesDir = path.join(root, "docs/fyp/images");

const pages = [
  { url: "http://127.0.0.1:5173/", file: "fig-5-1-ui-home.png", waitMs: 2000 },
  { url: "http://127.0.0.1:5173/ask", file: "fig-5-2-ui-ask.png", waitMs: 1500 },
  { url: "http://127.0.0.1:5173/voice", file: "fig-5-3-ui-voice.png", waitMs: 1500 },
  { url: "http://127.0.0.1:5173/find-lawyers", file: "fig-5-4-ui-find-lawyers.png", waitMs: 1500 },
  { url: "http://127.0.0.1:5173/poster", file: "fig-7-1-fyp-poster.png", waitMs: 2000 },
];

fs.mkdirSync(imagesDir, { recursive: true });

const chromePaths = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const executablePath = chromePaths.find((p) => fs.existsSync(p));

const browser = await puppeteer.launch({
  headless: true,
  executablePath,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

for (const item of pages) {
  process.stdout.write(`Capturing ${item.file} ... `);
  await page.goto(item.url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, item.waitMs));
  await page.screenshot({
    path: path.join(imagesDir, item.file),
    fullPage: false,
    type: "png",
  });
  console.log("OK");
}

await browser.close();
console.log(`\nSaved UI screenshots to ${imagesDir}`);
