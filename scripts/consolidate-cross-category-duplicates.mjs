import fs from "node:fs";

const dmrPath = "app/dmr-documents.json";
const npdesPath = "app/npdes-documents.json";

const duplicateHashes = new Set([
  "0b7e9c09363ef4b4e033aea714a6f28f067450885db25a15cb25fafbaaa3ac57",
  "4208a010fbb2ba933452c3c5fbc3a3ca11777d2ce6c45c37bbc398bf81eaa93c",
  "62419d534e4a3b5e9c7ab23a87f74c28947d9c377e7030f3739474ce74d632da",
  "8c90a77c94c4c47d904a0a76068fce14f071a6f27aaf4abb38476e6742711607",
  "a0347eae1366e621a4c9b8d250db86e6b9200b9d0517314155187c96a742a3d5",
  "e2dbe3db29a7938d6b9abeeec16fc44a7d4287f139033ccd00477c5338fabe95",
]);

const dmr = JSON.parse(fs.readFileSync(dmrPath, "utf8"));
const npdes = JSON.parse(fs.readFileSync(npdesPath, "utf8"));
const removed = dmr.filter((document) => duplicateHashes.has(document.sha256));
if (removed.length !== duplicateHashes.size) {
  throw new Error(`Expected ${duplicateHashes.size} DMR duplicates, found ${removed.length}`);
}

const preferred = new Map(removed.map((document) => [document.sha256, document]));
for (const document of npdes) {
  const source = preferred.get(document.sha256);
  if (!source) continue;
  if (source.year !== "Undated") document.year = source.year;
  if (/^\d{4}-\d{2}-\d{2}__/.test(source.name)) document.name = source.name;
}

fs.writeFileSync(dmrPath, `${JSON.stringify(dmr.filter((document) => !duplicateHashes.has(document.sha256)), null, 2)}\n`);
fs.writeFileSync(npdesPath, `${JSON.stringify(npdes, null, 2)}\n`);
console.log(JSON.stringify({ removed: removed.map((document) => document.id), remainingDmr: dmr.length - removed.length, npdes: npdes.length }));
