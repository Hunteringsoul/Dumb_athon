@echo off
REM Batch script to download face-api.js weights
REM Run this script by double-clicking it

echo Creating weights directory...
if not exist "weights" mkdir weights

echo Downloading face-api.js weights from GitHub...
echo.

curl -L -o "weights\tiny_face_detector_model-weights_manifest.json" "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json"
curl -L -o "weights\tiny_face_detector_model-shard1" "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1"
curl -L -o "weights\face_landmark_68_model-weights_manifest.json" "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json"
curl -L -o "weights\face_landmark_68_model-shard1" "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1"
curl -L -o "weights\face_recognition_model-weights_manifest.json" "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json"
curl -L -o "weights\face_recognition_model-shard1" "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1"
curl -L -o "weights\face_recognition_model-shard2" "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2"

echo.
echo Done! Weights downloaded to weights folder
echo You can now refresh your webpage.
pause
