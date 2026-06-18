/**
 * Render Mermaid diagram sources to PNG via mermaid.ink (no local Chrome required).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const diagramsDir = path.join(root, "docs/fyp/diagrams");
const imagesDir = path.join(root, "docs/fyp/images");

const map = [
  ["01-system-architecture.md", "fig-4-1-system-architecture.png"],
  ["02-rag-pipeline.md", "fig-4-2-rag-pipeline.png"],
  ["03-data-flow-sequence.md", "fig-4-3-data-flow-sequence.png"],
  ["04-use-case-diagram.md", "fig-4-4-use-case-diagram.png"],
  ["05-database-schema.md", "fig-4-5-database-schema.png"],
  ["06-component-module.md", "fig-4-6-component-module.png"],
  ["07-deployment-diagram.md", "fig-4-7-deployment-diagram.png"],
  ["08-block-diagram.md", "fig-1-block-diagram.png"],
  ["09-project-milestone-chart.md", "fig-2-project-milestone-chart.png"],
  ["10-activity-diagram.md", "fig-4-8-activity-diagram.png"],
  ["11-class-diagram.md", "fig-4-9-class-diagram.png"],
  ["12-user-state-transition.md", "fig-4-10-user-state-transition.png"],
  ["13-admin-state-transition.md", "fig-4-11-admin-state-transition.png"],
  ["14-context-level-dfd.md", "fig-4-12-context-level-dfd.png"],
  ["15-user-level0-dfd.md", "fig-4-13-user-level0-dfd.png"],
  ["16-admin-level0-dfd.md", "fig-4-14-admin-level0-dfd.png"],
  ["17-system-level0-dfd.md", "fig-4-15-system-level0-dfd.png"],
  ["18-level1-rag-dfd.md", "fig-4-16-level1-rag-dfd.png"],
  ["19-auth-sequence-diagram.md", "fig-4-17-auth-sequence-diagram.png"],
  ["20-voice-processing-sequence.md", "fig-4-18-voice-processing-sequence.png"],
  ["21-ocr-ingestion-flow.md", "fig-4-19-ocr-ingestion-flow.png"],
  ["22-security-threat-model.md", "fig-4-20-security-threat-model.png"],
  ["23-lawyer-recommendation-flow.md", "fig-4-21-lawyer-recommendation-flow.png"],
  ["24-firebase-collections-map.md", "fig-4-22-firebase-collections-map.png"],
];

function extractMermaid(markdown) {
  const match = markdown.match(/```mermaid\r?\n([\s\S]*?)```/);
  if (!match) throw new Error("No mermaid block found");
  return match[1].trimEnd();
}

function toMermaidInkUrl(code) {
  const encoded = Buffer.from(code, "utf8").toString("base64url");
  const params = new URLSearchParams({
    type: "png",
    bgColor: "FFFFFF",
    theme: "neutral",
    width: "1400",
    scale: "2",
  });
  return `https://mermaid.ink/img/${encoded}?${params.toString()}`;
}

async function download(url, dest, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buf);
        return;
      }
      if (attempt === retries) {
        throw new Error(`HTTP ${res.status} for ${dest}`);
      }
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
    }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
}

fs.mkdirSync(imagesDir, { recursive: true });

for (const [srcName, outName] of map) {
  const srcPath = path.join(diagramsDir, srcName);
  const markdown = fs.readFileSync(srcPath, "utf8");
  const code = extractMermaid(markdown);
  const url = toMermaidInkUrl(code);
  const outPath = path.join(imagesDir, outName);
  process.stdout.write(`Rendering ${outName} ... `);
  await download(url, outPath);
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`OK (${sizeKb} KB)`);
}

console.log(`\nSaved ${map.length} images to ${imagesDir}`);
