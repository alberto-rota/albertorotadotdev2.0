import fs from "fs";
import path from "path";

const root = path.resolve(".");
const productsPath = path.join(root, "src/data/products.json");
const sectionsDataPath = path.join(root, "scripts/research-sections-data.json");

const site = JSON.parse(fs.readFileSync(productsPath, "utf8"));
const sectionsData = JSON.parse(fs.readFileSync(sectionsDataPath, "utf8"));

const SECTION_ORDER = [
  "abstract",
  "introduction",
  "methodology",
  "results",
  "conclusion",
];

const SECTION_TITLES = {
  abstract: "Abstract",
  introduction: "Introduction",
  methodology: "Methodology",
  results: "Results",
  conclusion: "Conclusion",
};

function buildSections(slug) {
  const data = sectionsData[slug];
  if (!data) return undefined;
  return SECTION_ORDER.map((key) => ({
    title: SECTION_TITLES[key],
    blocks: [{ type: "paragraph", text: data[key] }],
  }));
}

for (const product of site.products) {
  if (product.tag !== "research") continue;
  const slug = product.slug;
  if (!slug || !sectionsData[slug]) continue;

  const sections = buildSections(slug);
  if (!sections) continue;

  product.details = product.details ?? {};
  product.details.sections = sections;
  delete product.details.body;
  delete product.details.highlights;

  // Ensure MESA has a pdf path for the Paper morph button
  if (slug === "mesa" && !product.details.pdf) {
    product.details.pdf =
      "/pdfs/Adapting%20Foundation%20Models%20for%20Annotation-Efficient%20Adnexal%20Mass%20Segmentation%20in%20Cine%20Images.pdf";
  }
}

fs.writeFileSync(productsPath, JSON.stringify(site, null, 2) + "\n", "utf8");
console.log("Updated research sections in products.json");
