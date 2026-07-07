import fs from "fs";
import path from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const pdfDir = path.join("public", "pdfs");
const outDir = path.join("scripts", "pdf-text");
fs.mkdirSync(outDir, { recursive: true });

const files = fs
  .readdirSync(pdfDir)
  .filter((f) => f.endsWith(".pdf") && f !== "CV_Alberto_Rota.pdf")
  .sort();

for (const file of files) {
  const buf = new Uint8Array(fs.readFileSync(path.join(pdfDir, file)));
  const doc = await getDocument({ data: buf, useSystemFonts: true }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  const outName = file.replace(/\.pdf$/i, ".txt");
  fs.writeFileSync(path.join(outDir, outName), text, "utf8");
  console.log(`${file}: ${doc.numPages} pages, ${text.length} chars`);
}
