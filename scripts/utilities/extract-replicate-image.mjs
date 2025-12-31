import fs from "node:fs";
import path from "node:path";

/**
 * Extract binary image from replicate-output.json
 * The Replicate API returns raw binary data which gets captured as strings.
 * This script reconstructs the binary image using latin1 encoding.
 */

const outputPath = "replicate-output.json";
const imagesDir = "images";

if (!fs.existsSync(outputPath)) {
  console.error(`❌ ${outputPath} not found`);
  process.exit(1);
}

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(outputPath, "utf8"));
const { lines = [], savedFiles = [] } = data;

if (!lines || lines.length === 0) {
  console.log("✓ No binary lines to extract");
  if (savedFiles.length > 0) {
    console.log("✓ Already has savedFiles:", savedFiles);
  }
  process.exit(0);
}

// Reconstruct binary data from lines array
// Each line is a string chunk of the binary data stored with latin1 encoding
const chunks = [];
for (const line of lines) {
  if (typeof line === "string" && line.length > 0) {
    // Use latin1 encoding to preserve byte values (0-255)
    chunks.push(Buffer.from(line, "latin1"));
  }
}

if (chunks.length === 0) {
  console.log("✓ No binary chunks found");
  process.exit(0);
}

const binaryBuffer = Buffer.concat(chunks);
console.log(`📦 Reconstructed ${binaryBuffer.length} bytes from ${chunks.length} chunks`);

// Detect image type from magic bytes
let ext = ".jpg";
if (binaryBuffer.length > 4) {
  const header = binaryBuffer.slice(0, 4);
  if (header[0] === 0xff && header[1] === 0xd8) ext = ".jpg"; // JPEG SOI marker
  else if (header[0] === 0x89 && header[1] === 0x50) ext = ".png"; // PNG signature
  else if (header[0] === 0x47 && header[1] === 0x49) ext = ".gif"; // GIF signature
  else if (header[0] === 0x52 && header[1] === 0x49) ext = ".webp"; // WEBP signature
}

const tag = new Date()
  .toISOString()
  .replace(/[:.]/g, "")
  .slice(0, 15);
const filename = `replicate-${tag}${ext}`;
const filepath = path.join(imagesDir, filename);

fs.writeFileSync(filepath, binaryBuffer);
console.log(`✅ Saved: ${filepath} (${binaryBuffer.length} bytes)`);

// Update output JSON to remove inline binary and reference saved file
const updated = {
  ...data,
  lines: [], // Clear binary lines
  savedFiles: [...(savedFiles || []), filepath],
};
fs.writeFileSync(outputPath, JSON.stringify(updated, null, 2));
console.log(`✅ Updated ${outputPath} (removed binary data, added file reference)`);
