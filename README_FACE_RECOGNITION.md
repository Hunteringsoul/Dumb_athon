# Face Recognition Setup Instructions

## Problem: Model Weights Not Loading from CDN

If you're seeing a 404 error when trying to load face recognition models, the CDN sources may be unavailable or the weights path is incorrect.

## Solution: Download Weights Locally

### Step 1: Download the Weights

1. Go to: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Download these files:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1`
   - `face_recognition_model-shard2`

### Step 2: Create Weights Folder

1. Create a folder named `weights` in your project root directory (same level as `index.html`)
2. Place all downloaded files into this `weights` folder

### Step 3: Update Your Server

If you're using a local server (like Live Server), make sure it serves the `weights` folder correctly.

### Alternative: Use a Different CDN

The code will automatically try multiple CDN sources. If one fails, it will try the next one.

## File Structure Should Look Like:

```
Apoclypse/
├── index.html
├── script.js
├── face-recognition.js
├── style.css
└── weights/
    ├── tiny_face_detector_model-weights_manifest.json
    ├── tiny_face_detector_model-shard1
    ├── face_landmark_68_model-weights_manifest.json
    ├── face_landmark_68_model-shard1
    ├── face_recognition_model-weights_manifest.json
    ├── face_recognition_model-shard1
    └── face_recognition_model-shard2
```

## Quick Fix Script

If you have Node.js installed, you can run this in your project directory:

```bash
mkdir weights
cd weights
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
```

## Testing

After setting up the weights, refresh your page. The face recognition system should load the models from the local `weights` folder.
