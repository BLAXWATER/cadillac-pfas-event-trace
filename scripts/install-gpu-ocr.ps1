param(
  [string]$PythonPath = ""
)

$ErrorActionPreference = "Stop"
$siteRoot = Split-Path -Parent $PSScriptRoot
$workRoot = Split-Path -Parent $siteRoot
$target = Join-Path $workRoot ".ocr-gpu-tools"

if (-not $PythonPath) {
  $bundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
  if (Test-Path -LiteralPath $bundledPython) {
    $PythonPath = $bundledPython
  } else {
    $PythonPath = (Get-Command python -ErrorAction Stop).Source
  }
}

& nvidia-smi | Out-Null
& $PythonPath -m pip install --upgrade --target $target "onnxruntime-gpu[cuda,cudnn]==1.29.0"
if ($LASTEXITCODE -ne 0) {
  throw "ONNX Runtime GPU installation failed."
}

$probe = @"
import sys
sys.path.insert(0, r'$target')
import onnxruntime as ort
ort.preload_dlls(directory='')
providers = ort.get_available_providers()
print(f'ONNX Runtime {ort.__version__}: {providers}')
if ort.get_device() != 'GPU' or 'CUDAExecutionProvider' not in providers:
    raise SystemExit('CUDAExecutionProvider is unavailable')
"@
& $PythonPath -c $probe
if ($LASTEXITCODE -ne 0) {
  throw "CUDA provider verification failed."
}

Write-Output "GPU OCR runtime installed and verified at $target"
Write-Output "Use: python scripts/audit-corpus-ocr.py --ocr-device gpu --workers 2"
