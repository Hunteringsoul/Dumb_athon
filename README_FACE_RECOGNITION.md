# Apoclypse Panic Button

A comprehensive survival planning application featuring face recognition security, interactive maps, and scenario-based resource tracking for various apocalypse scenarios.

## Features

- 🔐 **Face Recognition Security** - Secure access using facial recognition//**PASSWORD TO UPLOAD NEW FACE="dumb"**
- 🎮 **Doom CAPTCHA** - Interactive CAPTCHA challenge
- 🗺️ **Interactive Resource Map** - Track survival resources across the globe
- 📍 **Multiple Scenarios** - Zombie outbreak, disease pandemic, nuclear disaster
- 🚨 **Panic Button** - Emergency alert system with backend logging
- 📊 **Resource Tracking** - Mark and manage food, water, medical supplies, shelters, and more

## Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Webcam access (for face recognition)
- Node.js and npm (for backend server - optional)
- A local web server (for serving files - required for face recognition models)

## Installation

### 1. Clone or Download the Repository

```bash
git clone <repository-url>
cd Apoclypse
```

### 2. Download Face Recognition Model Weights

The face recognition feature requires model weights to be downloaded locally. You have two options:

#### Option A: Use the Batch Script (Windows)

1. Run `download-missing-weights.bat` in the project root directory
2. This will download all required model weights to the `weights/` folder

#### Option B: Manual Download

1. Navigate to the `weights/` folder
2. Run `download-weights.bat` (Windows) or `download-weights.ps1` (PowerShell)
3. Alternatively, manually download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Required files:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

### 3. Install Backend Dependencies (Optional)

If you want to use the panic button backend logging:

```bash
cd backend
npm install
```

## Usage

### Starting the Application

#### Frontend Only (Without Backend)

1. **Start a Local Web Server**

   You **must** use a local web server (not just opening `index.html` directly) because:
   - Face recognition models need to be loaded from local files
   - CORS restrictions require a proper server

   **Option 1: Using Python**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option 2: Using Node.js (http-server)**
   ```bash
   npx http-server -p 8000
   ```

   **Option 3: Using VS Code Live Server**
   - Install the "Live Server" extension
   - Right-click on `index.html` and select "Open with Live Server"

2. **Open in Browser**
   - Navigate to `http://localhost:8000` (or the port you specified)
   - Grant camera permissions when prompted

#### With Backend Server

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:4000`

2. **Start the Frontend** (as described above)

3. **Open in Browser**
   - Navigate to `http://localhost:8000`
   - The panic button will now log to the backend server

## How to Use

### 1. Face Recognition Setup

On first launch, you'll see the face recognition lock screen:

1. **Grant Camera Permissions** - Allow the browser to access your webcam
2. **Train Your Face** - Click "Train Face Recognition" and follow the prompts:
   - Look directly at the camera
   - The system will capture your face for recognition
   - You may need to train multiple times for better accuracy
3. **Unlock** - Once trained, your face will be recognized automatically
4. **Password Fallback** - If face recognition fails, you can use the password: `apoclypse2024`

### 2. Ragebait CAPTCHA

After face recognition, you may encounter a ragebait CAPTCHA:

- **Read the Instructions Carefully** - Some instructions are designed to trick you
- **Select the Correct Images** - Choose images that match the actual requirement (not the trick instruction)
- **Complete the Challenge** - Successfully complete the CAPTCHA to proceed

### 3. Main Interface

Once unlocked, you'll see the main panic button interface:

- **Panic Button** - Click the large red button to trigger an emergency alert
- **Scenario Selection** - Choose from three scenarios:
  - 🧟 **Zombie Outbreak**
  - 🦠 **Disease Pandemic**
  - ☢️ **Nuclear Disaster**

### 4. Resource Map

After selecting a scenario, you'll see an interactive world map:

#### Viewing Resources
- **Pre-loaded Resources** - The map comes with pre-seeded resource locations worldwide
- **Your Location** - A blue pulsing marker shows your current location (if geolocation is enabled)
- **Legend** - Click "☰ Legend" to view all resource types and counts

#### Adding Resources
1. **Select Resource Type** - Use the marker type picker (bottom right) to choose a resource type:
   - 🧃 **Survival Resources**: Food, Water, Medical, Shelter, Medicine
   - ⚙️ **Infrastructure**: Power, Fuel, Comms, Transport, Military
   - ⚠️ **Hazards**: Safe Zones, Danger Zones, Radiation, Biohazard, Weapons
2. **Click on Map** - Click anywhere on the map to place a marker
3. **Edit Marker** - Click on a marker to:
   - Rename the location
   - Add notes/status
   - Save changes
   - Delete the marker

#### Managing Resources
- **Toggle Layers** - Click resource types in the legend to show/hide them
- **View Statistics** - The legend shows counts for each resource type
- **Change Scenario** - Click "← Change scenario" to switch between scenarios

### 5. Panic Button

The panic button sends an alert to the backend server (if running):

- **Single Click** - Triggers a panic alert
- **Backend Logging** - If the backend is running, it logs the panic event
- **Status Check** - Visit `http://localhost:4000/status` to see panic count

## Project Structure

```
Apoclypse/
├── index.html              # Main application file
├── script.js               # Frontend JavaScript logic
├── style.css               # Application styles
├── face-recognition.js     # Face recognition library wrapper
├── weights/                # Face recognition model weights
│   ├── *.json              # Model manifests
│   └── *-shard*            # Model weight files
├── backend/                # Backend server
│   ├── server.js           # Express server
│   └── package.json        # Node.js dependencies
├── doomcaptcha-main/       # Doom CAPTCHA integration
└── README.md               # This file
```

## Troubleshooting

### Face Recognition Not Working

1. **Check Camera Permissions**
   - Ensure your browser has camera access
   - Check browser settings for site permissions

2. **Verify Model Weights**
   - Ensure all weight files are in the `weights/` folder
   - Check browser console for 404 errors
   - Re-download weights if missing

3. **Use Local Server**
   - Never open `index.html` directly (file:// protocol)
   - Always use a local web server (http://localhost)

4. **Browser Compatibility**
   - Use a modern browser (Chrome, Firefox, Edge, Safari)
   - Enable JavaScript
   - Check for browser console errors

### Map Not Loading

1. **Check Internet Connection** - The map uses external tile servers
2. **Check Browser Console** - Look for JavaScript errors
3. **Verify Leaflet Library** - Ensure CDN resources are accessible

### Backend Not Responding

1. **Check if Server is Running**
   ```bash
   cd backend
   npm start
   ```

2. **Check Port Conflicts** - Ensure port 4000 is not in use
3. **Verify CORS** - Backend should have CORS enabled (already configured)

### Geolocation Not Working

- The map will still work without geolocation
- Your location marker won't appear if:
  - You deny location permissions
  - Your browser doesn't support geolocation
  - You're using an insecure connection (HTTPS required for geolocation)

## Security Notes

- **Face Recognition** - Face data is stored locally in browser localStorage
- **No External Servers** - Face recognition runs entirely in your browser
- **Password Fallback** - The password is hardcoded in the client (not secure for production)
- **Backend Logging** - Panic button logs are stored in-memory (not persistent)

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Older browsers may have limited support

## License

Check individual component licenses:
- Face recognition: face-api.js license
- Doom CAPTCHA: Check doomcaptcha-main/LICENSE
- Map tiles: OpenStreetMap/CARTO attribution

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify all prerequisites are installed
3. Ensure you're using a local web server
4. Check that model weights are properly downloaded

## Future Enhancements

- Persistent storage for markers
- Export/import map data
- Multi-user support
- Enhanced face recognition accuracy
- Mobile app version

---

**Stay Prepared. Stay Safe. 🚨**
