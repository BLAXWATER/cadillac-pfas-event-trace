import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

test("OCR audit selects CUDA explicitly and preserves a truthful CPU fallback", async () => {
  const source = await readFile(path.join(root, "scripts", "audit-corpus-ocr.py"), "utf8");

  assert.match(source, /choices=\("auto", "cpu", "gpu"\)/);
  assert.match(source, /CUDAExecutionProvider/);
  assert.match(source, /CUDA OCR was requested but is unavailable/);
  assert.match(source, /CUDA OCR initialization fell back/);
  assert.match(source, /ort\.preload_dlls\(directory=""\)/);
  assert.match(source, /effective_workers = min\(max\(1, workers\), 2\)/);
});

test("GPU runtime installation is reproducible and version-pinned", async () => {
  const source = await readFile(path.join(root, "scripts", "install-gpu-ocr.ps1"), "utf8");

  assert.match(source, /onnxruntime-gpu\[cuda,cudnn\]==1\.29\.0/);
  assert.match(source, /CUDAExecutionProvider is unavailable/);
  assert.match(source, /nvidia-smi/);
});
