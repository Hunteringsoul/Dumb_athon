# PowerShell script to download face-api.js weights
# Run this script in PowerShell: .\download-weights.ps1

$weightsUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
$weightsDir = "weights"

# Create weights directory if it doesn't exist
if (-not (Test-Path $weightsDir)) {
    New-Item -ItemType Directory -Path $weightsDir
    Write-Host "Created weights directory" -ForegroundColor Green
}

# List of required weight files
$files = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2"
)

Write-Host "Downloading face-api.js weights..." -ForegroundColor Yellow

foreach ($file in $files) {
    $url = "$weightsUrl/$file"
    $output = "$weightsDir/$file"
    
    try {
        Write-Host "Downloading $file..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        Write-Host "✓ Downloaded $file" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to download $file : $_" -ForegroundColor Red
    }
}

Write-Host "`nDone! Weights downloaded to $weightsDir folder" -ForegroundColor Green
Write-Host "You can now refresh your webpage." -ForegroundColor Yellow
