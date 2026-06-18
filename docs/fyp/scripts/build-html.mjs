/**
 * Build printable HTML report from Voice2Law-FYP2-Report.md
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fypDir = path.resolve(__dirname, "..");
const mdPath = path.join(fypDir, "Voice2Law-FYP2-Report.md");
const outPath = path.join(fypDir, "Voice2Law-FYP2-Report.html");

marked.setOptions({ gfm: true, breaks: false });

const md = fs.readFileSync(mdPath, "utf8");
let body = marked.parse(md);

// Remove duplicate title block from MD (we use styled title page)
body = body.replace(/^<h1[^>]*>Voice2Law[\s\S]*?<hr>\s*/i, "");

// Wrap embedded figures with semantic figure/figcaption blocks
body = body.replace(
  /<p><img src="(images\/[^"]+)" alt="([^"]*)"><\/p>\s*<p><strong>(Figure [\s\S]*?)<\/strong>([\s\S]*?)<\/p>/g,
  '<figure class="figure"><img src="$1" alt="$2" loading="lazy" /><figcaption><strong>$3</strong>$4</figcaption></figure>'
);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Voice2Law — FYP-II Report</title>
  <style>
    :root {
      --primary: #0B3D2E;
      --secondary: #1FAA59;
      --accent: #C5A253;
      --text: #1E293B;
      --muted: #64748B;
      --border: #E2E8F0;
      --bg: #FFFFFF;
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Georgia", "Times New Roman", serif;
      line-height: 1.65;
      color: var(--text);
      background: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--bg);
      padding: 48px 56px;
      box-shadow: 0 4px 24px rgba(0,0,0,.08);
    }
    h1, h2, h3, h4 { color: var(--primary); font-family: "Segoe UI", Arial, sans-serif; page-break-after: avoid; }
    h1 { font-size: 1.75rem; border-bottom: 3px solid var(--secondary); padding-bottom: 12px; margin-top: 2rem; }
    h2 { font-size: 1.35rem; margin-top: 2.5rem; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
    h3 { font-size: 1.1rem; margin-top: 1.5rem; }
    p { text-align: justify; margin: 0.75rem 0; }
    ul, ol { margin: 0.75rem 0; padding-left: 1.5rem; }
    li { margin: 0.35rem 0; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; page-break-inside: avoid; }
    th, td { border: 1px solid var(--border); padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #E8F5ED; color: var(--primary); }
    tr:nth-child(even) { background: #f8fafc; }
    .title-page { text-align: center; padding: 60px 0 40px; page-break-after: always; }
    .title-page h1 { border: none; font-size: 2rem; margin-top: 0; }
    .title-page .subtitle { font-size: 1.15rem; color: var(--muted); margin: 12px 0 32px; }
    .meta-table { margin: 24px auto; max-width: 640px; }
    .report-body img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #fff;
    }
    .figure {
      margin: 1.5rem 0;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #fafafa;
      page-break-inside: avoid;
    }
    .figure figcaption {
      font-size: 0.88rem;
      color: var(--muted);
      font-style: italic;
      text-align: center;
      margin-top: 10px;
      line-height: 1.5;
    }
    blockquote { background: #F8FAFC; border-left: 4px solid var(--accent); margin: 1rem 0; padding: 10px 16px; color: var(--muted); font-size: 0.92rem; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.88em; }
    pre { background: #1e293b; color: #e2e8f0; padding: 14px; border-radius: 8px; overflow-x: auto; font-size: 0.82rem; page-break-inside: avoid; }
    pre code { background: transparent; color: inherit; padding: 0; }
    hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
    a { color: var(--primary); }
    @media print {
      body { background: white; }
      .container { box-shadow: none; padding: 24px 32px; max-width: 100%; }
      .no-print { display: none; }
      h1 { page-break-before: always; }
      .title-page h1 { page-break-before: avoid; }
    }
    .print-btn {
      position: fixed; top: 16px; right: 16px;
      background: var(--primary); color: white; border: none;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      font-weight: 600; z-index: 100;
    }
    .print-btn:hover { background: var(--secondary); }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>

  <div class="container">
    <section class="title-page">
      <p style="font-size:0.9rem;color:var(--muted);">Final Year Project Report (FYP-II)</p>
      <h1>Voice2Law</h1>
      <p class="subtitle">AI-Based Urdu/English Legal Information Assistant for Pakistan</p>
      <table class="meta-table">
        <tr><th>Department</th><td>Department of FEST, FAST-NUCES</td></tr>
        <tr><th>Program</th><td>B.S. Software Engineering</td></tr>
        <tr><th>Session</th><td>2025–2026</td></tr>
        <tr><th>Supervisor</th><td>Abdul Wahab Khan, MS (Computer Science)</td></tr>
        <tr><th>Team</th><td>Syed Muhammad Umer (62993), Muhammad Shahmir Iqbal (62602), Ahmed Ali Ghori (60117), Rameel Khan (62603)</td></tr>
        <tr><th>Submission Date</th><td>June 2026</td></tr>
      </table>
    </section>

    <div class="report-body">
${body}
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(outPath, html, "utf8");
console.log(`Wrote ${outPath}`);
