import Replicate from "replicate";
import fs from "node:fs";
import path from "node:path";

// Reads API key from REPLICATE_API_KEY or REPLICATE_API_TOKEN
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN,
});

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function timestampTag() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function isHttpUrl(s) {
  return typeof s === "string" && /^https?:\/\//i.test(s);
}

function isDataUrl(s) {
  return typeof s === "string" && /^data:image\/(png|jpeg|jpg);base64,/i.test(s);
}

function extFromContentType(ct) {
  if (!ct) return ".jpg";
  if (ct.includes("png")) return ".png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
  if (ct.includes("webp")) return ".webp";
  return ".jpg";
}

async function saveHttpImage(url, outDir, baseName, index) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image ${url} (${res.status})`);
  const ct = res.headers.get("content-type") || "image/jpeg";
  const ext = extFromContentType(ct);
  const fileName = `${baseName}-${index}${ext}`;
  const filePath = path.join(outDir, fileName);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
  return filePath;
}

function saveDataImage(dataUrl, outDir, baseName, index) {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  const ext = match && match[1] ? (match[1].toLowerCase() === "png" ? ".png" : ".jpg") : ".jpg";
  const b64 = match && match[2] ? match[2] : dataUrl;
  const fileName = `${baseName}-${index}${ext}`;
  const filePath = path.join(outDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(b64, "base64"));
  return filePath;
}

async function saveImagesFromOutputs(outputs) {
  const outDir = path.join(process.cwd(), "images");
  ensureDir(outDir);
  const tag = timestampTag();
  const baseName = `replicate-${tag}`;
  const saved = [];

  const flat = [];
  for (const o of outputs || []) {
    if (Array.isArray(o)) flat.push(...o);
    else flat.push(o);
  }

  let i = 1;
  for (const item of flat) {
    try {
      if (typeof item === "string") {
        if (isHttpUrl(item)) {
          const savedPath = await saveHttpImage(item, outDir, baseName, i++);
          console.log("Saved image:", savedPath);
          saved.push(savedPath);
        } else if (isDataUrl(item)) {
          const savedPath = saveDataImage(item, outDir, baseName, i++);
          console.log("Saved image:", savedPath);
          saved.push(savedPath);
        }
      } else if (item && typeof item === "object") {
        const url = item.url || item.image || item.output || item.data;
        if (typeof url === "string") {
          if (isHttpUrl(url)) {
            const savedPath = await saveHttpImage(url, outDir, baseName, i++);
            console.log("Saved image:", savedPath);
            saved.push(savedPath);
          } else if (isDataUrl(url)) {
            const savedPath = saveDataImage(url, outDir, baseName, i++);
            console.log("Saved image:", savedPath);
            saved.push(savedPath);
          }
        } else if (Array.isArray(url)) {
          for (const u of url) {
            if (typeof u === "string" && (isHttpUrl(u) || isDataUrl(u))) {
              const savedPath = isHttpUrl(u)
                ? await saveHttpImage(u, outDir, baseName, i++)
                : saveDataImage(u, outDir, baseName, i++);
              console.log("Saved image:", savedPath);
              saved.push(savedPath);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to save one output item:", e.message || e);
    }
  }

  return saved;
}

// Helper: consume a ReadableStream from Replicate and log events/output
async function consumeReplicateStream(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const lines = [];
  const outputs = [];

  console.log("Replicate: streaming output…");
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // Stream is typically NDJSON with one JSON object per line
    const parts = buffer.split("\n");
    // Keep the last partial line in buffer
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      if (!line.trim()) continue;
      lines.push(line);
      try {
        const evt = JSON.parse(line);
        const evtName = evt.event || evt.type || "unknown";
        const data = evt.data ?? evt.output ?? evt;
        // Log concise info
        console.log("[replicate stream]", evtName, Array.isArray(data) ? `items:${data.length}` : typeof data);
        // Capture output events if present
        if (evtName === "output" || evtName === "completed") {
          outputs.push(data);
        }
      } catch (e) {
        // Not JSON: log raw line once
        console.log("[replicate stream raw]", line.slice(0, 120));
      }
    }
  }

  // If there is a final buffer chunk, push as raw
  if (buffer.trim()) lines.push(buffer);

  return { lines, outputs };
}

async function main() {
  if (!replicate.auth) {
    throw new Error(
      "Missing Replicate API key. Set REPLICATE_API_KEY or REPLICATE_API_TOKEN in your environment."
    );
  }

  const output = await replicate.run("prunaai/z-image-turbo", {
    input: {
      width: 1024,
      height: 768,
      prompt:
        "A hyper-realistic, close-up portrait of a tribal elder from the Omo Valley, painted with intricate white chalk patterns and adorned with a headdress made of dried flowers, seed pods, and rusted bottle caps. The focus is razor-sharp on the texture of the skin, showing every pore, wrinkle, and scar that tells a story of survival. The background is a blurred, smoky hut interior, with the warm glow of a cooking fire reflecting in the subject's dark, soulful eyes. Shot on a Leica M6 with Kodak Portra 400 film grain aesthetic.",
      output_format: "jpg",
      guidance_scale: 0,
      output_quality: 80,
      num_inference_steps: 8,
    },
  });

  const outPath = "replicate-output.json";
  if (output && typeof output.getReader === "function") {
    // Web ReadableStream
    const consumed = await consumeReplicateStream(output);
    console.log("Replicate stream consumed:", {
      lines: consumed.lines.length,
      outputs: consumed.outputs.length,
    });
    const savedFiles = await saveImagesFromOutputs(consumed.outputs);
    const payload = { ...consumed, savedFiles };
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  } else {
    // Array or string or JSON output
    console.log("Replicate output:", output);
    const savedFiles = await saveImagesFromOutputs(Array.isArray(output) ? output : [output]);
    const payload = { output, savedFiles };
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  }
  console.log(`Saved output to ${outPath}`);
}

main().catch((err) => {
  console.error("Replicate run failed:", err.message || err);
  process.exit(1);
});
