// ────────────────── FACE RECOGNITION ACCESS CONTROL ──────────────────
let faceRecognitionInitialized = false;
let isUnlocked = false;
let faceDescriptor = null;
let video = null;
let canvas = null;
let ctx = null;
let detectionInterval = null;

const FACE_MATCH_THRESHOLD = 0.6; // Lower = more strict (0-1)
const STORAGE_KEY = 'fariz_face_descriptor';

// ────────────────── INITIALIZE ──────────────────
async function initFaceRecognition() {
  if (faceRecognitionInitialized) return;
  
  video = document.getElementById('videoElement');
  canvas = document.getElementById('canvasElement');
  ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('faceStatus');
  const lockScreen = document.getElementById('faceLockScreen');
  const mainApp = document.getElementById('mainApp');
  const trainBtn = document.getElementById('trainFaceBtn');

  try {
    statusEl.textContent = 'Loading face recognition models...';
    statusEl.className = 'face-status scanning';

    // Load face-api models
    // Try GitHub raw content first (most reliable), then local weights
    const GITHUB_MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    
    let modelsLoaded = false;
    
    // Try GitHub first
    try {
      statusEl.textContent = 'Loading models from GitHub (this may take a moment)...';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(GITHUB_MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(GITHUB_MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(GITHUB_MODEL_URL)
      ]);
      modelsLoaded = true;
      statusEl.textContent = 'Models loaded! Initializing camera...';
    } catch (githubError) {
      console.warn('GitHub source failed, trying local weights...', githubError);
      
      // Try local weights as fallback
      try {
        statusEl.textContent = 'Trying local weights folder...';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('./weights'),
          faceapi.nets.faceLandmark68Net.loadFromUri('./weights'),
          faceapi.nets.faceRecognitionNet.loadFromUri('./weights')
        ]);
        modelsLoaded = true;
        statusEl.textContent = 'Models loaded from local folder!';
      } catch (localError) {
        console.error('Local weights also failed:', localError);
        modelsLoaded = false;
      }
    }
    
    if (!modelsLoaded) {
      const errorMsg = 'Failed to load models. Run download-weights.bat (Windows) or download-weights.ps1 (PowerShell) to download weights locally, then refresh.';
      statusEl.textContent = errorMsg;
      statusEl.className = 'face-status denied';
      throw new Error('Failed to load face recognition models from all sources');
    }

    // Load saved face descriptor from localStorage
    const savedDescriptor = localStorage.getItem(STORAGE_KEY);
    if (savedDescriptor) {
      try {
        faceDescriptor = JSON.parse(savedDescriptor);
        statusEl.textContent = 'Face profile loaded. Scanning...';
      } catch (e) {
        console.error('Failed to load saved face descriptor:', e);
      }
    }

    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: 640, 
        height: 480,
        facingMode: 'user' 
      } 
    });
    
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });

    statusEl.textContent = faceDescriptor 
      ? 'Scanning for authorized face...' 
      : 'No face profile found. Please train the system first.';
    statusEl.className = 'face-status scanning';

    // Start face detection
    startFaceDetection();

    // Training button handler
    trainBtn.addEventListener('click', async () => {
      await trainFace();
    });

    faceRecognitionInitialized = true;
  } catch (error) {
    console.error('Face recognition initialization error:', error);
    statusEl.textContent = 'Error: ' + (error.message || 'Failed to access camera');
    statusEl.className = 'face-status denied';
    
    if (error.name === 'NotAllowedError') {
      statusEl.textContent = 'Camera access denied. Please allow camera access and refresh.';
    } else if (error.name === 'NotFoundError') {
      statusEl.textContent = 'No camera found. Please connect a camera.';
    }
  }
}

// ────────────────── FACE DETECTION ──────────────────
function startFaceDetection() {
  if (detectionInterval) return;
  
  detectionInterval = setInterval(async () => {
    if (isUnlocked || !video || !canvas) return;
    
    try {
      // Detect faces
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Draw detection boxes
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const resizedDetections = faceapi.resizeResults(detections, {
        width: canvas.width,
        height: canvas.height
      });

      const statusEl = document.getElementById('faceStatus');

      if (detections.length === 0) {
        statusEl.textContent = 'No face detected. Please look at the camera.';
        statusEl.className = 'face-status scanning';
        return;
      }

      // If no face descriptor is trained, just show detection
      if (!faceDescriptor) {
        statusEl.textContent = `${detections.length} face(s) detected. Train the system to enable recognition.`;
        statusEl.className = 'face-status scanning';
        drawFaceBoxes(resizedDetections, false);
        return;
      }

      // Check if any detected face matches Fariz
      let matchFound = false;
      for (const detection of detections) {
        const distance = faceapi.euclideanDistance(
          detection.descriptor,
          new Float32Array(faceDescriptor)
        );
        
        const isMatch = distance < FACE_MATCH_THRESHOLD;
        
        if (isMatch) {
          matchFound = true;
          statusEl.textContent = '✓ Face recognized! Access granted.';
          statusEl.className = 'face-status recognized';
          drawFaceBoxes(resizedDetections, true, detection);
          
          // Unlock after brief confirmation
          setTimeout(() => {
            unlockApp();
          }, 1000);
          break;
        }
      }

      if (!matchFound) {
        statusEl.textContent = '✗ Face not recognized. Access denied.';
        statusEl.className = 'face-status denied';
        drawFaceBoxes(resizedDetections, false);
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }
  }, 500); // Check every 500ms
}

// ────────────────── DRAW FACE BOXES ──────────────────
function drawFaceBoxes(detections, isMatch, matchedDetection = null) {
  ctx.strokeStyle = isMatch ? '#28c864' : '#ff4b6e';
  ctx.lineWidth = 2;
  ctx.font = '16px system-ui';
  ctx.fillStyle = isMatch ? '#28c864' : '#ff4b6e';

  detections.forEach((detection, index) => {
    const box = detection.detection.box;
    const isThisMatch = matchedDetection && detection === matchedDetection;
    
    // Draw box
    ctx.strokeStyle = isThisMatch ? '#28c864' : '#ff4b6e';
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    // Draw label
    const label = isThisMatch ? '✓ Authorized' : '✗ Unauthorized';
    ctx.fillStyle = isThisMatch ? '#28c864' : '#ff4b6e';
    ctx.fillRect(box.x, box.y - 25, box.width, 25);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, box.x + 5, box.y - 8);
  });
}

// ────────────────── TRAIN FACE ──────────────────
async function trainFace() {
  const statusEl = document.getElementById('faceStatus');
  const trainBtn = document.getElementById('trainFaceBtn');
  
  if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
    statusEl.textContent = 'Camera not ready. Please wait...';
    statusEl.className = 'face-status scanning';
    return;
  }

  try {
    statusEl.textContent = 'Capturing face... Please look directly at the camera.';
    statusEl.className = 'face-status scanning';
    trainBtn.disabled = true;
    trainBtn.textContent = 'Training...';

    // Wait a moment for user to position
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Detect and extract face descriptor
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      statusEl.textContent = 'No face detected. Please ensure your face is visible.';
      statusEl.className = 'face-status denied';
      trainBtn.disabled = false;
      trainBtn.textContent = '📸 Train Face Recognition';
      return;
    }

    if (detections.length > 1) {
      statusEl.textContent = 'Multiple faces detected. Please ensure only one person is in frame.';
      statusEl.className = 'face-status denied';
      trainBtn.disabled = false;
      trainBtn.textContent = '📸 Train Face Recognition';
      return;
    }

    // Save the face descriptor
    const descriptor = Array.from(detections[0].descriptor);
    faceDescriptor = descriptor;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(descriptor));

    statusEl.textContent = '✓ Face profile saved! Scanning for recognition...';
    statusEl.className = 'face-status recognized';
    trainBtn.disabled = false;
    trainBtn.textContent = '📸 Retrain Face Recognition';

    // Show success message
    setTimeout(() => {
      statusEl.textContent = 'Scanning for authorized face...';
      statusEl.className = 'face-status scanning';
    }, 3000);

  } catch (error) {
    console.error('Training error:', error);
    statusEl.textContent = 'Training failed: ' + error.message;
    statusEl.className = 'face-status denied';
    trainBtn.disabled = false;
    trainBtn.textContent = '📸 Train Face Recognition';
  }
}

// ────────────────── UNLOCK APP ──────────────────
function unlockApp() {
  if (isUnlocked) return;
  
  isUnlocked = true;
  const lockScreen = document.getElementById('faceLockScreen');
  const mainApp = document.getElementById('mainApp');
  
  // Stop detection
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  
  // Stop video stream
  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
  }
  
  // Hide lock screen and show app
  lockScreen.classList.add('unlocked');
  setTimeout(() => {
    lockScreen.style.display = 'none';
    mainApp.style.display = 'block';
  }, 500);
  
  // Initialize main app (script.js will check if it should run)
  if (typeof initMainApp === 'function') {
    initMainApp();
  }
}

// ────────────────── START ON PAGE LOAD ──────────────────
document.addEventListener('DOMContentLoaded', () => {
  initFaceRecognition();
});
