@echo off
echo Downloading missing tiny_face_detector weights manifest...
curl -L -o "weights\tiny_face_detector_model-weights_manifest.json" "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json"
echo.
echo Done! Now refresh your webpage.
pause
