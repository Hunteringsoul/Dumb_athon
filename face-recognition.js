// ────────────────── FACE RECOGNITION ACCESS CONTROL ──────────────────
let faceRecognitionInitialized = false;
let isUnlocked = false;
let faceDescriptor = null;
let video = null;
let canvas = null;
let ctx = null;
let detectionInterval = null;

const FACE_MATCH_THRESHOLD = 0.4; // Lower = more strict (0-1). 0.4 is strict, 0.5 is moderate, 0.6 is lenient
const STORAGE_KEY = 'fariz_face_descriptor';
const TRAINING_SAMPLES = 5; // Number of face samples to capture for better accuracy
const TRAINING_PASSWORD = 'dumb'; // Password required to train face recognition

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
  const cameraErrorSection = document.getElementById('cameraErrorSection');
  const retryCameraBtn = document.getElementById('retryCameraBtn');

  try {
    statusEl.textContent = 'Loading face recognition models...';
    statusEl.className = 'face-status scanning';

    // Load face-api models - PRIORITIZE LOCAL WEIGHTS FIRST
    let modelsLoaded = false;
    
    // Try local weights first (since user has them installed)
    try {
      statusEl.textContent = 'Loading models from local weights folder...';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('./weights'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./weights'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./weights')
      ]);
      modelsLoaded = true;
      statusEl.textContent = 'Models loaded successfully!';
    } catch (localError) {
      console.warn('Local weights failed, trying GitHub...', localError);
      
      // Fallback to GitHub if local fails
      try {
        statusEl.textContent = 'Trying GitHub source...';
        const GITHUB_MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(GITHUB_MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(GITHUB_MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(GITHUB_MODEL_URL)
        ]);
        modelsLoaded = true;
        statusEl.textContent = 'Models loaded from GitHub!';
      } catch (githubError) {
        console.error('All sources failed:', githubError);
        modelsLoaded = false;
      }
    }
    
    if (!modelsLoaded) {
      const errorMsg = 'Failed to load models. Please ensure weights folder contains all required files.';
      statusEl.textContent = errorMsg;
      statusEl.className = 'face-status denied';
      throw new Error('Failed to load face recognition models');
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

    // Training button handler - requires password
    trainBtn.addEventListener('click', async () => {
      const password = prompt('Enter password to train face recognition:');
      if (password === null) {
        return; // User cancelled
      }
      if (password !== TRAINING_PASSWORD) {
        const statusEl = document.getElementById('faceStatus');
        statusEl.textContent = '✗ Incorrect password. Training denied.';
        statusEl.className = 'face-status denied';
        setTimeout(() => {
          statusEl.textContent = faceDescriptor 
            ? 'Scanning for authorized face...' 
            : 'No face profile found. Please train the system first.';
          statusEl.className = 'face-status scanning';
        }, 2000);
        return;
      }
      // Password correct, proceed with training
      console.log('Password correct, starting training...');
      try {
        await trainFace();
      } catch (error) {
        console.error('Training error in handler:', error);
        const statusEl = document.getElementById('faceStatus');
        statusEl.textContent = 'Training failed: ' + error.message;
        statusEl.className = 'face-status denied';
        const trainBtn = document.getElementById('trainFaceBtn');
        trainBtn.disabled = false;
        trainBtn.textContent = '📸 Train Face Recognition';
      }
    });

    // Retry camera button handler
    retryCameraBtn.addEventListener('click', async () => {
      cameraErrorSection.style.display = 'none';
      statusEl.textContent = 'Requesting camera access...';
      statusEl.className = 'face-status scanning';
      try {
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
        startFaceDetection();
      } catch (retryError) {
        console.error('Camera retry failed:', retryError);
        if (retryError.name === 'NotAllowedError') {
          statusEl.textContent = 'Camera access still denied. Please allow in browser settings.';
          cameraErrorSection.style.display = 'block';
        } else {
          statusEl.textContent = 'Camera error: ' + retryError.message;
          cameraErrorSection.style.display = 'block';
        }
        statusEl.className = 'face-status denied';
      }
    });

    faceRecognitionInitialized = true;
  } catch (error) {
    console.error('Face recognition initialization error:', error);
    statusEl.textContent = 'Error: ' + (error.message || 'Failed to access camera');
    statusEl.className = 'face-status denied';
    
    if (error.name === 'NotAllowedError') {
      statusEl.textContent = 'Camera access denied. Please allow camera access.';
      cameraErrorSection.style.display = 'block';
    } else if (error.name === 'NotFoundError') {
      statusEl.textContent = 'No camera found. Please connect a camera.';
      cameraErrorSection.style.display = 'block';
    } else {
      cameraErrorSection.style.display = 'block';
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
      let bestMatch = null;
      let bestDistance = Infinity;
      
      for (const detection of detections) {
        const distance = faceapi.euclideanDistance(
          detection.descriptor,
          new Float32Array(faceDescriptor)
        );
        
        // Track the best match
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = detection;
        }
        
        const isMatch = distance < FACE_MATCH_THRESHOLD;
        
        if (isMatch) {
          matchFound = true;
          statusEl.textContent = `✓ Face recognized! (Distance: ${distance.toFixed(3)}) Access granted.`;
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
        // Show distance for debugging
        const distanceText = bestMatch ? ` (Distance: ${bestDistance.toFixed(3)}, threshold: ${FACE_MATCH_THRESHOLD})` : '';
        statusEl.textContent = `✗ Face not recognized. Access denied.${distanceText}`;
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
  
  console.log('trainFace called, video state:', video ? video.readyState : 'video is null');
  
  // Check if face-api is loaded
  if (typeof faceapi === 'undefined') {
    statusEl.textContent = 'Error: Face recognition models not loaded. Please refresh the page.';
    statusEl.className = 'face-status denied';
    return;
  }
  
  if (!video) {
    statusEl.textContent = 'Error: Camera not initialized. Please refresh the page.';
    statusEl.className = 'face-status denied';
    return;
  }
  
  // Ensure video is playing
  if (video.paused) {
    try {
      await video.play();
    } catch (playError) {
      console.error('Failed to play video:', playError);
    }
  }
  
  // Wait for video to be ready
  if (video.readyState < video.HAVE_CURRENT_DATA) {
    statusEl.textContent = 'Waiting for camera to be ready...';
    statusEl.className = 'face-status scanning';
    // Wait for video to load
    await new Promise((resolve) => {
      const checkReady = () => {
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }
  
  // Additional wait to ensure video frame is available
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    trainBtn.disabled = true;
    trainBtn.textContent = 'Training...';
    statusEl.textContent = 'Preparing to capture face samples...';
    statusEl.className = 'face-status scanning';

    // Capture multiple samples for better accuracy
    const descriptors = [];
    
    for (let i = 0; i < TRAINING_SAMPLES; i++) {
      statusEl.textContent = `Capturing sample ${i + 1} of ${TRAINING_SAMPLES}... Look directly at camera.`;
      statusEl.className = 'face-status scanning';
      trainBtn.textContent = `Training... ${i + 1}/${TRAINING_SAMPLES}`;
      
      // Wait between samples to ensure video frame updates
      // Give user time to position and ensure fresh frame
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Detect and extract face descriptor
      console.log(`Attempting to detect face for sample ${i + 1}...`);
      
      // Try multiple times if face not detected immediately
      let detections = [];
      let attempts = 0;
      const maxAttempts = 3;
      
      while (detections.length === 0 && attempts < maxAttempts) {
        detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
        
        if (detections.length === 0 && attempts < maxAttempts - 1) {
          statusEl.textContent = `Sample ${i + 1}: Looking for face... (attempt ${attempts + 2}/${maxAttempts})`;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        attempts++;
      }
      
      console.log(`Sample ${i + 1}: Found ${detections.length} face(s) after ${attempts} attempt(s)`);

      if (detections.length === 0) {
        statusEl.textContent = `Sample ${i + 1}: No face detected. Please ensure your face is visible.`;
        statusEl.className = 'face-status denied';
        trainBtn.disabled = false;
        trainBtn.textContent = '📸 Train Face Recognition';
        return;
      }

      if (detections.length > 1) {
        statusEl.textContent = `Sample ${i + 1}: Multiple faces detected. Please ensure only one person is in frame.`;
        statusEl.className = 'face-status denied';
        trainBtn.disabled = false;
        trainBtn.textContent = '📸 Train Face Recognition';
        return;
      }

      // Store the descriptor
      descriptors.push(Array.from(detections[0].descriptor));
    }

    // Average all descriptors for better accuracy
    const averagedDescriptor = new Array(descriptors[0].length).fill(0);
    for (const desc of descriptors) {
      for (let i = 0; i < desc.length; i++) {
        averagedDescriptor[i] += desc[i];
      }
    }
    for (let i = 0; i < averagedDescriptor.length; i++) {
      averagedDescriptor[i] /= descriptors.length;
    }

    // Save the averaged face descriptor
    faceDescriptor = averagedDescriptor;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(averagedDescriptor));

    // Show completion message
    statusEl.textContent = `✓ Training complete! Face profile saved with ${TRAINING_SAMPLES} samples.`;
    statusEl.className = 'face-status recognized';
    trainBtn.disabled = false;
    trainBtn.textContent = '📸 Retrain Face Recognition';

    // Wait a moment to show success, then start scanning
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    statusEl.textContent = 'Scanning for authorized face...';
    statusEl.className = 'face-status scanning';
    
    // Restart face detection if it was stopped
    if (!detectionInterval) {
      startFaceDetection();
    }

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
  
  // Show CAPTCHA instead of directly unlocking
  showRagebaitCaptcha();
}

// ────────────────── RAGEBAIT CAPTCHA SYSTEM ──────────────────
let captchaSequence = [];
let currentCaptchaIndex = 0;
let captchaAttempts = 0;
const REQUIRED_CAPTCHAS = 3;
const captchaTypes = [
  'imageGrid', 'trickQuestion', 'movingTarget', 'blurryText', 
  'impossibleGrid', 'mathPuzzle', 'colorMatch', 'wordScramble',
  'sliderPuzzle', 'countChallenge', 'reverseText', 'patternMatch',
  'doomShooter', 'typingTest', 'memoryGame', 'fakeLoading'
];

function showRagebaitCaptcha() {
  const captchaScreen = document.getElementById('ragebaitCaptcha');
  const lockScreen = document.getElementById('faceLockScreen');
  
  // Hide face lock screen
  lockScreen.style.display = 'none';
  
  // Show CAPTCHA
  captchaScreen.classList.add('active');
  
  // Generate sequence of 3 random CAPTCHAs (no duplicates)
  captchaSequence = [];
  const availableTypes = [...captchaTypes];
  for (let i = 0; i < REQUIRED_CAPTCHAS; i++) {
    const randomIndex = Math.floor(Math.random() * availableTypes.length);
    captchaSequence.push(availableTypes.splice(randomIndex, 1)[0]);
  }
  
  currentCaptchaIndex = 0;
  captchaAttempts = 0;
  loadNextCaptcha();
}

function loadNextCaptcha() {
  const progress = document.getElementById('captchaProgress');
  progress.textContent = `Challenge ${currentCaptchaIndex + 1} of ${REQUIRED_CAPTCHAS}`;
  
  loadCaptchaChallenge(captchaSequence[currentCaptchaIndex]);
}

function loadCaptchaChallenge(type) {
  const content = document.getElementById('captchaContent');
  const error = document.getElementById('captchaError');
  const progress = document.getElementById('captchaProgress');
  
  error.textContent = '';
  captchaAttempts = 0;
  
  switch(type) {
    case 'imageGrid':
      loadImageGridCaptcha(content, progress);
      break;
    case 'trickQuestion':
      loadTrickQuestionCaptcha(content, progress);
      break;
    case 'movingTarget':
      loadMovingTargetCaptcha(content, progress);
      break;
    case 'blurryText':
      loadBlurryTextCaptcha(content, progress);
      break;
    case 'impossibleGrid':
      loadImpossibleGridCaptcha(content, progress);
      break;
    case 'mathPuzzle':
      loadMathPuzzleCaptcha(content, progress);
      break;
    case 'colorMatch':
      loadColorMatchCaptcha(content, progress);
      break;
    case 'wordScramble':
      loadWordScrambleCaptcha(content, progress);
      break;
    case 'sliderPuzzle':
      loadSliderPuzzleCaptcha(content, progress);
      break;
    case 'countChallenge':
      loadCountChallengeCaptcha(content, progress);
      break;
    case 'reverseText':
      loadReverseTextCaptcha(content, progress);
      break;
    case 'patternMatch':
      loadPatternMatchCaptcha(content, progress);
      break;
    case 'doomShooter':
      loadDoomShooterCaptcha(content, progress);
      break;
    case 'typingTest':
      loadTypingTestCaptcha(content, progress);
      break;
    case 'memoryGame':
      loadMemoryGameCaptcha(content, progress);
      break;
    case 'fakeLoading':
      loadFakeLoadingCaptcha(content, progress);
      break;
  }
}

// Challenge 1: Image Grid - "Select all images that are NOT Zombies"
function loadImageGridCaptcha(content, progress) {
  const images = [
    {type: 'zombie', emoji: '🧟', label: 'Zombie'},
    {type: 'safe', emoji: '✅', label: 'Safe Zone'},
    {type: 'zombie', emoji: '🧟‍♂️', label: 'Zombie'},
    {type: 'safe', emoji: '🏥', label: 'Hospital'},
    {type: 'zombie', emoji: '🧟‍♀️', label: 'Zombie'},
    {type: 'safe', emoji: '🌾', label: 'Food'},
    {type: 'zombie', emoji: '🧟', label: 'Zombie'},
    {type: 'safe', emoji: '💧', label: 'Water'},
    {type: 'zombie', emoji: '🧟‍♂️', label: 'Zombie'}
  ];
  
  const selected = new Set();
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction trick">
        ⚠️ Select ALL images that are <strong>NOT</strong> Zombies. 
        <br><small style="color:rgba(255,255,255,.4);">(Hint: Look carefully, some might be tricky)</small>
        <br><small style="color:rgba(255,200,100,.6);font-style:italic;">Wait, actually select images that ARE zombies. No wait, NOT zombies. Or both?</small>
      </div>
      <div class="captcha-grid" id="imageGrid">
        ${images.map((img, i) => `
          <div class="captcha-item" data-type="${img.type}" data-index="${i}">
            <div style="font-size:3rem;display:flex;align-items:center;justify-content:center;height:100%;">${img.emoji}</div>
            <div class="captcha-item-label">${img.label}</div>
          </div>
        `).join('')}
      </div>
      <button class="captcha-submit" id="submitGrid">Verify Selection</button>
    </div>
  `;
  
  // Add click handlers
  document.querySelectorAll('#imageGrid .captcha-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('selected');
      const index = parseInt(item.dataset.index);
      if (selected.has(index)) {
        selected.delete(index);
      } else {
        selected.add(index);
      }
    });
  });
  
  document.getElementById('submitGrid').addEventListener('click', () => {
    captchaAttempts++;
    const correct = images.every((img, i) => {
      if (img.type === 'safe') {
        return selected.has(i);
      } else {
        return !selected.has(i);
      }
    });
    
    if (correct && selected.size === images.filter(img => img.type === 'safe').length) {
      // Fake delay to make it frustrating
      progress.textContent = 'Verifying selection...';
      setTimeout(() => {
        progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
        setTimeout(() => advanceToNextCaptcha(), 1000);
      }, 1500);
    } else {
      error.textContent = `❌ Incorrect. You selected ${selected.size} items. Try again. (Attempt ${captchaAttempts})`;
      // Reset selection on wrong answer (frustrating!)
      if (captchaAttempts >= 2) {
        selected.clear();
        document.querySelectorAll('#imageGrid .captcha-item').forEach(item => {
          item.classList.remove('selected');
        });
        error.textContent += ' Selection reset. Select only safe zones (✅🏥🌾💧)';
      } else if (captchaAttempts >= 3) {
        error.textContent += ' Hint: Select only the safe zones (✅🏥🌾💧)';
      }
    }
  });
}

// Challenge 2: Trick Question
function loadTrickQuestionCaptcha(content, progress) {
  const questions = [
    {
      question: 'What is the capital of the apocalypse?',
      options: ['There is no capital', 'The last safe zone', 'Your current location', 'None of the above'],
      correct: 3, // "None of the above" - trick question
      instruction: 'Select the correct answer. Read carefully.'
    },
    {
      question: 'How many zombies can you see in this question?',
      options: ['0', '1', '2', '3'],
      correct: 0, // Trick - there are no zombies in the question text
      instruction: 'Count carefully. The question asks about "in this question".'
    },
    {
      question: 'What color is the text you are reading right now?',
      options: ['White', 'Pink', 'Red', 'Yellow'],
      correct: 0, // White (or close to it)
      instruction: 'Look at the actual text color, not the background.'
    }
  ];
  
  const q = questions[Math.floor(Math.random() * questions.length)];
  let selected = null;
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction">${q.instruction}</div>
      <div class="trick-question">
        <div style="font-size:1.1rem;margin-bottom:15px;font-weight:600;">${q.question}</div>
        ${q.options.map((opt, i) => `
          <label style="display:block;padding:10px;margin:8px 0;background:rgba(255,255,255,.05);border-radius:6px;cursor:pointer;transition:background .2s;" 
                 onmouseover="this.style.background='rgba(255,75,110,.2)'" 
                 onmouseout="this.style.background='rgba(255,255,255,.05)'">
            <input type="radio" name="trickQ" value="${i}" style="margin-right:10px;">
            ${opt}
          </label>
        `).join('')}
      </div>
      <button class="captcha-submit" id="submitTrick">Verify Answer</button>
    </div>
  `;
  
  document.querySelectorAll('input[name="trickQ"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      selected = parseInt(e.target.value);
    });
  });
  
  document.getElementById('submitTrick').addEventListener('click', () => {
    captchaAttempts++;
    if (selected === q.correct) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      error.textContent = `❌ Wrong answer. Try again. (Attempt ${captchaAttempts})`;
      if (captchaAttempts >= 2) {
        error.textContent += ` Hint: Read the question very carefully.`;
      }
    }
  });
}

// Challenge 3: Moving Target (Easier version)
function loadMovingTargetCaptcha(content, progress) {
  let clicks = 0;
  const requiredClicks = 3; // Reduced from 5 to 3
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction">
        Click the moving red circle <strong>${requiredClicks} times</strong> to verify.
        <br><small style="color:rgba(255,255,255,.4);">The circle moves slowly. Take your time.</small>
      </div>
      <div style="position:relative;width:100%;height:300px;background:rgba(0,0,0,.3);border-radius:12px;overflow:hidden;margin:20px 0;" id="targetContainer">
        <div class="moving-target" id="movingTarget" style="top:50%;left:50%;width:80px;height:80px;"></div>
      </div>
      <div style="text-align:center;font-size:.9rem;color:rgba(255,255,255,.6);">
        Clicks: <span id="clickCount">0</span> / ${requiredClicks}
      </div>
      <button class="captcha-submit" id="submitMoving" disabled>Verify</button>
    </div>
  `;
  
  const target = document.getElementById('movingTarget');
  const container = document.getElementById('targetContainer');
  const clickCount = document.getElementById('clickCount');
  const submitBtn = document.getElementById('submitMoving');
  
  // Make target move randomly (slower = easier)
  let moveInterval = setInterval(() => {
    const x = Math.random() * (container.offsetWidth - 80);
    const y = Math.random() * (container.offsetHeight - 80);
    target.style.transition = 'all 0.5s ease'; // Smooth movement
    target.style.left = x + 'px';
    target.style.top = y + 'px';
  }, 1500); // Slower movement (was 600ms, now 1500ms)
  
  target.addEventListener('click', () => {
    clicks++;
    clickCount.textContent = clicks;
    // Visual feedback - easier to see
    target.style.transform = 'scale(1.2)';
    setTimeout(() => {
      target.style.transform = 'scale(1)';
    }, 200);
    
    if (clicks >= requiredClicks) {
      clearInterval(moveInterval);
      submitBtn.disabled = false;
      target.style.background = '#28c864';
      target.style.transition = 'all 0.3s';
      progress.textContent = 'Target acquired! Click verify.';
    }
  });
  
  submitBtn.addEventListener('click', () => {
    if (clicks >= requiredClicks) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    }
  });
}

// Challenge 4: Blurry Text
function loadBlurryTextCaptcha(content, progress) {
  const codes = ['APOC2024', 'SURVIVE', 'FARIZ', 'SAFEZONE'];
  const code = codes[Math.floor(Math.random() * codes.length)];
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction trick">
        Enter the text shown below. It's intentionally blurry to prevent bots.
        <br><small style="color:rgba(255,200,100,.6);">Actually, ignore the blurry text. Type "VERIFY" instead. Just kidding, use the blurry text.</small>
      </div>
      <div style="text-align:center;margin:25px 0;">
        <div style="font-size:3rem;font-weight:700;letter-spacing:.3em;color:#ff4b6e;filter:blur(4px);text-shadow:0 0 15px rgba(255,75,110,.5);user-select:none;animation:pulse 2s infinite;">
          ${code}
        </div>
        <div style="font-size:.75rem;color:rgba(255,255,255,.3);margin-top:10px;opacity:0.5;">
          (The text might be: ${code.split('').map(c => Math.random() > 0.5 ? c : '?').join(' ')})
        </div>
      </div>
      <input type="text" class="captcha-input" id="blurryInput" placeholder="Enter the text above" autocomplete="off">
      <button class="captcha-submit" id="submitBlurry">Verify</button>
    </div>
  `;
  
  document.getElementById('submitBlurry').addEventListener('click', () => {
    captchaAttempts++;
    const input = document.getElementById('blurryInput').value.trim().toUpperCase();
    if (input === code) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      error.textContent = `❌ Incorrect text. Try again. (Attempt ${captchaAttempts})`;
      if (captchaAttempts >= 2) {
        error.textContent += ` Hint: It's shown below the blurry text.`;
      }
    }
  });
}

// Challenge 5: Impossible Grid (but actually possible)
function loadImpossibleGridCaptcha(content, progress) {
  const grid = [
    [1, 0, 1, 0],
    [0, 1, 0, 1],
    [1, 0, 1, 0],
    [0, 1, 0, 1]
  ];
  
  // Instructions are misleading - actually just click all squares
  let clicked = new Set();
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction trick">
        Click all squares in a pattern that forms a diagonal line from top-left to bottom-right.
        <br><small style="color:rgba(255,255,255,.4);">(This is harder than it looks)</small>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:300px;margin:20px auto;">
        ${grid.flat().map((val, i) => `
          <div class="captcha-item" data-index="${i}" style="aspect-ratio:1;min-height:60px;">
            <div style="font-size:1.5rem;display:flex;align-items:center;justify-content:center;height:100%;">${val === 1 ? '☢️' : '✅'}</div>
          </div>
        `).join('')}
      </div>
      <div class="captcha-instruction" style="font-size:.8rem;color:rgba(255,255,255,.5);">
        Actually, just click all the squares. The instructions were misleading. 😈
      </div>
      <button class="captcha-submit" id="submitGrid2">Verify</button>
    </div>
  `;
  
  document.querySelectorAll('[data-index]').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index);
      item.classList.toggle('selected');
      if (clicked.has(idx)) {
        clicked.delete(idx);
      } else {
        clicked.add(idx);
      }
    });
  });
  
  document.getElementById('submitGrid2').addEventListener('click', () => {
    captchaAttempts++;
    if (clicked.size === 16) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      error.textContent = `❌ You clicked ${clicked.size}/16 squares. Click all of them. (Attempt ${captchaAttempts})`;
    }
  });
}

function advanceToNextCaptcha() {
  currentCaptchaIndex++;
  
  if (currentCaptchaIndex >= REQUIRED_CAPTCHAS) {
    // All CAPTCHAs completed!
    completeCaptcha();
  } else {
    // Load next CAPTCHA
    loadNextCaptcha();
  }
}

function completeCaptcha() {
  isUnlocked = true;
  const captchaScreen = document.getElementById('ragebaitCaptcha');
  const mainApp = document.getElementById('mainApp');
  
  const progress = document.getElementById('captchaProgress');
  progress.textContent = 'All challenges completed! Unlocking...';
  
  setTimeout(() => {
    captchaScreen.classList.remove('active');
    mainApp.style.display = 'block';
    
    // Initialize main app
    if (typeof initMainApp === 'function') {
      initMainApp();
    }
  }, 1500);
}

// Challenge 6: Math Puzzle
function loadMathPuzzleCaptcha(content, progress) {
  const error = document.getElementById('captchaError');
  const puzzles = [
    {q: 'What is 2 + 2?', a: '4', trick: 'But wait, in the apocalypse, 2+2 might equal survival. Enter the mathematical answer.'},
    {q: 'If you have 5 zombies and eliminate 3, how many remain?', a: '2', trick: 'Simple math. Just count.'},
    {q: 'What is 10 divided by 2?', a: '5', trick: 'Basic division. No tricks here. Or are there?'}
  ];
  
  const p = puzzles[Math.floor(Math.random() * puzzles.length)];
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction trick">${p.trick}</div>
      <div class="trick-question">
        <div style="font-size:1.3rem;margin:20px 0;text-align:center;font-weight:600;">${p.q}</div>
      </div>
      <input type="text" class="captcha-input" id="mathInput" placeholder="Enter your answer" autocomplete="off">
      <button class="captcha-submit" id="submitMath">Verify</button>
    </div>
  `;
  
  document.getElementById('submitMath').addEventListener('click', () => {
    captchaAttempts++;
    const input = document.getElementById('mathInput').value.trim();
    if (input === p.a) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      error.textContent = `❌ Incorrect. Try again. (Attempt ${captchaAttempts})`;
      if (captchaAttempts >= 2) {
        error.textContent += ` Hint: The answer is ${p.a}`;
      }
    }
  });
}

// Challenge 7: Color Match
function loadColorMatchCaptcha(content, progress) {
  const error = document.getElementById('captchaError');
  const colors = ['#ff4b6e', '#28c864', '#4af', '#ffb428', '#a050ff'];
  const targetColor = colors[Math.floor(Math.random() * colors.length)];
  const targetIndex = colors.indexOf(targetColor);
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction">
        Click the color that matches the box below. The colors might look similar.
      </div>
      <div style="text-align:center;margin:25px 0;">
        <div style="width:150px;height:150px;background:${targetColor};border-radius:12px;margin:0 auto;border:3px solid rgba(255,255,255,.3);box-shadow:0 0 30px ${targetColor};"></div>
        <div style="margin-top:15px;font-size:.9rem;color:rgba(255,255,255,.6);">Target Color</div>
      </div>
      <div style="display:flex;gap:15px;justify-content:center;flex-wrap:wrap;margin:25px 0;">
        ${colors.map((color, i) => `
          <div class="captcha-item" data-color="${i}" style="width:80px;height:80px;cursor:pointer;">
            <div style="width:100%;height:100%;background:${color};border-radius:8px;border:2px solid rgba(255,255,255,.3);"></div>
          </div>
        `).join('')}
      </div>
      <button class="captcha-submit" id="submitColor">Verify Selection</button>
    </div>
  `;
  
  let selected = null;
  document.querySelectorAll('[data-color]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('[data-color]').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      selected = parseInt(item.dataset.color);
    });
  });
  
  document.getElementById('submitColor').addEventListener('click', () => {
    captchaAttempts++;
    if (selected === targetIndex) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      error.textContent = `❌ Wrong color. Try again. (Attempt ${captchaAttempts})`;
    }
  });
}

// Challenge 8: Word Scramble
function loadWordScrambleCaptcha(content, progress) {
  const error = document.getElementById('captchaError');
  const words = ['SURVIVE', 'APOCALYPSE', 'SAFEZONE', 'FARIZ'];
  const word = words[Math.floor(Math.random() * words.length)];
  const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction">
        Unscramble this word. All letters must be used exactly once.
      </div>
      <div style="text-align:center;margin:25px 0;">
        <div style="font-size:2.5rem;letter-spacing:.3em;font-weight:700;color:#ff4b6e;text-shadow:0 0 20px rgba(255,75,110,.5);">
          ${scrambled.split('').join(' ')}
        </div>
      </div>
      <input type="text" class="captcha-input" id="scrambleInput" placeholder="Enter unscrambled word" autocomplete="off" style="text-transform:uppercase;">
      <button class="captcha-submit" id="submitScramble">Verify</button>
    </div>
  `;
  
  document.getElementById('submitScramble').addEventListener('click', () => {
    captchaAttempts++;
    const input = document.getElementById('scrambleInput').value.trim().toUpperCase();
    if (input === word) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      error.textContent = `❌ Incorrect word. Try again. (Attempt ${captchaAttempts})`;
      if (captchaAttempts >= 3) {
        error.textContent += ` Hint: It's related to survival.`;
      }
    }
  });
}

// Challenge 9: Count Challenge
function loadCountChallengeCaptcha(content, progress) {
  const error = document.getElementById('captchaError');
  const items = ['🧟', '🧟', '✅', '🧟', '✅', '🧟', '✅', '🧟', '🧟', '✅', '🧟', '✅'];
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  const safeCount = items.filter(i => i === '✅').length;
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction trick">
        Count how many <strong>Safe Zones (✅)</strong> are in the grid below.
        <br><small style="color:rgba(255,255,255,.4);">Ignore the zombies. Only count safe zones.</small>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:320px;margin:25px auto;">
        ${shuffled.map((item, i) => `
          <div style="font-size:2.5rem;text-align:center;padding:15px;background:rgba(255,255,255,.05);border-radius:8px;border:1px solid rgba(255,255,255,.1);">
            ${item}
          </div>
        `).join('')}
      </div>
      <input type="number" class="captcha-input" id="countInput" placeholder="Enter the count" min="0" max="20">
      <button class="captcha-submit" id="submitCount">Verify</button>
    </div>
  `;
  
  document.getElementById('submitCount').addEventListener('click', () => {
    captchaAttempts++;
    const input = parseInt(document.getElementById('countInput').value);
    if (input === safeCount) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      error.textContent = `❌ Wrong count. Try again. (Attempt ${captchaAttempts})`;
      if (captchaAttempts >= 3) {
        error.textContent += ` Hint: Count only the ✅ symbols.`;
      }
    }
  });
}

// Challenge 10: Reverse Text
function loadReverseTextCaptcha(content, progress) {
  const error = document.getElementById('captchaError');
  const texts = ['FARIZ', 'APOCALYPSE', 'SURVIVE', 'SAFEZONE'];
  const text = texts[Math.floor(Math.random() * texts.length)];
  const reversed = text.split('').reverse().join('');
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction">
        The text below is reversed. Type it in the correct order.
      </div>
      <div style="text-align:center;margin:25px 0;">
        <div style="font-size:2rem;letter-spacing:.2em;font-weight:700;color:#ff4b6e;text-shadow:0 0 20px rgba(255,75,110,.5);font-family:monospace;">
          ${reversed}
        </div>
        <div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-top:10px;">
          (Read from right to left, then type left to right)
        </div>
      </div>
      <input type="text" class="captcha-input" id="reverseInput" placeholder="Enter the correct text" autocomplete="off" style="text-transform:uppercase;">
      <button class="captcha-submit" id="submitReverse">Verify</button>
    </div>
  `;
  
  document.getElementById('submitReverse').addEventListener('click', () => {
    captchaAttempts++;
    const input = document.getElementById('reverseInput').value.trim().toUpperCase();
    if (input === text) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      error.textContent = `❌ Incorrect. Try again. (Attempt ${captchaAttempts})`;
    }
  });
}

// Challenge 11: Pattern Match
function loadPatternMatchCaptcha(content, progress) {
  const error = document.getElementById('captchaError');
  const patterns = [
    {seq: [1, 2, 3, 4], next: 5, hint: 'Simple counting'},
    {seq: [2, 4, 6, 8], next: 10, hint: 'Even numbers'},
    {seq: [1, 3, 5, 7], next: 9, hint: 'Odd numbers'},
    {seq: [5, 10, 15, 20], next: 25, hint: 'Multiples of 5'}
  ];
  
  const p = patterns[Math.floor(Math.random() * patterns.length)];
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction">
        What number comes next in this sequence?
      </div>
      <div style="text-align:center;margin:25px 0;">
        <div style="font-size:2.5rem;letter-spacing:.2em;font-weight:700;color:#ff4b6e;">
          ${p.seq.join(' → ')} → ?
        </div>
      </div>
      <input type="number" class="captcha-input" id="patternInput" placeholder="Enter the next number">
      <button class="captcha-submit" id="submitPattern">Verify</button>
    </div>
  `;
  
  document.getElementById('submitPattern').addEventListener('click', () => {
    captchaAttempts++;
    const input = parseInt(document.getElementById('patternInput').value);
    if (input === p.next) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      error.textContent = `❌ Wrong number. Try again. (Attempt ${captchaAttempts})`;
      if (captchaAttempts >= 3) {
        error.textContent += ` Hint: ${p.hint}`;
      }
    }
  });
}

// Challenge 12: DOOM Shooter (from doomcaptcha)
function loadDoomShooterCaptcha(content, progress) {
  const error = document.getElementById('captchaError');
  let doomCompleted = false;
  const enemyCount = 6; // More enemies = more frustrating
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction trick">
        Kill <strong>${enemyCount} enemies</strong> to proceed. They move fast. Good luck.
        <br><small style="color:rgba(255,255,255,.4);">Click on enemies to shoot them. Timer is running.</small>
      </div>
      <div style="position:relative;width:100%;height:400px;background:#000;border:2px solid rgba(255,75,110,.4);border-radius:12px;overflow:hidden;margin:20px 0;">
        <iframe id="doom_captcha_frame" 
                src="./doomcaptcha-main/doomcaptcha-main/captcha.html?enemies=${enemyCount}&countdown=on" 
                style="width:100%;height:100%;border:none;pointer-events:auto;">
        </iframe>
      </div>
      <div style="text-align:center;font-size:.85rem;color:rgba(255,255,255,.5);margin-top:10px;">
        Enemies killed: <span id="doomKills">0</span> / ${enemyCount}
      </div>
      <button class="captcha-submit" id="submitDoom" disabled>Verify Completion</button>
    </div>
  `;
  
  // Listen for completion message from doomcaptcha
  window.addEventListener('message', function(e) {
    if (e.data === 1 || e.data === '1') {
      doomCompleted = true;
      document.getElementById('submitDoom').disabled = false;
      document.getElementById('doomKills').textContent = enemyCount;
      progress.textContent = 'All enemies eliminated!';
    }
  }, false);
  
  // Check if iframe loaded
  const iframe = document.getElementById('doom_captcha_frame');
  iframe.addEventListener('load', () => {
    // Give it a moment to initialize
    setTimeout(() => {
      progress.textContent = 'DOOM CAPTCHA loaded. Start shooting!';
    }, 1000);
  });
  
  document.getElementById('submitDoom').addEventListener('click', () => {
    captchaAttempts++;
    if (doomCompleted) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      error.textContent = `❌ You haven't killed all enemies yet! (Attempt ${captchaAttempts})`;
    }
  });
}

// Challenge 13: Typing Test (Frustrating)
function loadTypingTestCaptcha(content, progress) {
  const error = document.getElementById('captchaError');
  const texts = [
    'THE APOCALYPSE HAS BEGUN SURVIVE AT ALL COSTS',
    'FARIZ IS THE ONLY AUTHORIZED USER VERIFY NOW',
    'ZOMBIES ARE APPROACHING FIND SAFE ZONE IMMEDIATELY',
    'NUCLEAR FALLOUT DETECTED EVACUATE TO BUNKER NOW'
  ];
  const text = texts[Math.floor(Math.random() * texts.length)];
  let startTime = null;
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction trick">
        Type the text below <strong>EXACTLY</strong> as shown. Case-sensitive. No mistakes allowed.
        <br><small style="color:rgba(255,255,255,.4);">You have 30 seconds. Timer starts when you begin typing.</small>
      </div>
      <div style="text-align:center;margin:25px 0;padding:20px;background:rgba(0,0,0,.5);border-radius:8px;">
        <div style="font-size:1.1rem;letter-spacing:.1em;line-height:1.8;color:#ff4b6e;font-weight:600;font-family:monospace;">
          ${text}
        </div>
      </div>
      <div style="text-align:center;margin:15px 0;font-size:.9rem;color:rgba(255,255,255,.6);">
        Time: <span id="typingTimer">30</span>s | Characters: <span id="typingChars">0</span>/${text.length}
      </div>
      <textarea class="captcha-input" id="typingInput" rows="3" placeholder="Type the text above EXACTLY as shown..." style="font-family:monospace;text-transform:uppercase;" autocomplete="off"></textarea>
      <button class="captcha-submit" id="submitTyping">Verify</button>
    </div>
  `;
  
  const input = document.getElementById('typingInput');
  const timer = document.getElementById('typingTimer');
  const chars = document.getElementById('typingChars');
  let timeLeft = 30;
  let timerInterval = null;
  
  input.addEventListener('input', () => {
    if (!startTime) {
      startTime = Date.now();
      timerInterval = setInterval(() => {
        timeLeft--;
        timer.textContent = timeLeft;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          error.textContent = '❌ Time ran out! Try again.';
          input.disabled = true;
        }
      }, 1000);
    }
    chars.textContent = input.value.length;
    
    // Make it frustrating - reset on any mistake
    if (input.value.length > 0 && input.value.toUpperCase() !== text.substring(0, input.value.length).toUpperCase()) {
      if (captchaAttempts < 2) {
        error.textContent = '❌ Mistake detected! Text must match EXACTLY. Starting over...';
        setTimeout(() => {
          input.value = '';
          chars.textContent = '0';
          startTime = null;
          timeLeft = 30;
          timer.textContent = '30';
          if (timerInterval) clearInterval(timerInterval);
          error.textContent = '';
        }, 1500);
      }
    }
  });
  
  document.getElementById('submitTyping').addEventListener('click', () => {
    captchaAttempts++;
    if (timerInterval) clearInterval(timerInterval);
    const inputValue = input.value.trim().toUpperCase();
    if (inputValue === text.toUpperCase() && timeLeft > 0) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      if (timeLeft <= 0) {
        error.textContent = '❌ Time expired! Try again.';
      } else {
        error.textContent = `❌ Text doesn't match exactly. Try again. (Attempt ${captchaAttempts})`;
      }
      input.value = '';
      chars.textContent = '0';
      startTime = null;
      timeLeft = 30;
      timer.textContent = '30';
    }
  });
}

// Challenge 14: Memory Game (Frustrating)
function loadMemoryGameCaptcha(content, progress) {
  const error = document.getElementById('captchaError');
  const sequence = ['☢️', '🧟', '✅', '☠️', '🏥', '🔫'];
  const shuffled = [...sequence].sort(() => Math.random() - 0.5);
  let selected = [];
  let showSequence = true;
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction trick">
        Memorize the sequence below. You'll need to click them in the SAME ORDER.
        <br><small style="color:rgba(255,255,255,.4);">You have 5 seconds to memorize. Then they'll disappear.</small>
      </div>
      <div id="memorySequence" style="display:flex;gap:15px;justify-content:center;margin:25px 0;flex-wrap:wrap;">
        ${shuffled.map((item, i) => `
          <div style="font-size:3rem;padding:15px;background:rgba(255,75,110,.2);border-radius:12px;border:2px solid rgba(255,75,110,.4);min-width:80px;text-align:center;">
            ${item}
          </div>
        `).join('')}
      </div>
      <div id="memoryInput" style="display:none;">
        <div style="text-align:center;margin:20px 0;font-size:.9rem;color:rgba(255,255,255,.6);">
          Click the items in the order you saw them:
        </div>
        <div style="display:flex;gap:15px;justify-content:center;margin:25px 0;flex-wrap:wrap;">
          ${[...new Set(shuffled)].map((item, i) => `
            <div class="captcha-item memory-btn" data-item="${item}" style="font-size:3rem;padding:15px;min-width:80px;text-align:center;cursor:pointer;">
              ${item}
            </div>
          `).join('')}
        </div>
        <div style="text-align:center;margin:15px 0;font-size:.85rem;color:rgba(255,255,255,.5);">
          Your sequence: <span id="memorySelected"></span>
        </div>
        <button class="captcha-submit" id="submitMemory">Verify</button>
      </div>
    </div>
  `;
  
  // Show sequence, then hide it
  setTimeout(() => {
    document.getElementById('memorySequence').style.opacity = '0.3';
    setTimeout(() => {
      document.getElementById('memorySequence').style.display = 'none';
      document.getElementById('memoryInput').style.display = 'block';
    }, 2000);
  }, 5000);
  
  document.querySelectorAll('.memory-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selected.push(btn.dataset.item);
      document.getElementById('memorySelected').textContent = selected.join(' → ');
      btn.style.opacity = '0.5';
    });
  });
  
  document.getElementById('submitMemory').addEventListener('click', () => {
    captchaAttempts++;
    if (JSON.stringify(selected) === JSON.stringify(shuffled)) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    } else {
      error.textContent = `❌ Wrong sequence! Try again. (Attempt ${captchaAttempts})`;
      selected = [];
      document.getElementById('memorySelected').textContent = '';
      document.querySelectorAll('.memory-btn').forEach(btn => btn.style.opacity = '1');
      if (captchaAttempts >= 2) {
        error.textContent += ' The sequence was shown for 5 seconds.';
      }
    }
  });
}

// Challenge 15: Fake Loading (Ultra Frustrating)
function loadFakeLoadingCaptcha(content, progress) {
  const error = document.getElementById('captchaError');
  let fakeProgress = 0;
  let loadingComplete = false;
  
  content.innerHTML = `
    <div class="captcha-challenge">
      <div class="captcha-instruction trick">
        Please wait while we verify your humanity...
        <br><small style="color:rgba(255,255,255,.4);">This may take a while. Do not refresh.</small>
      </div>
      <div style="margin:30px 0;">
        <div style="width:100%;height:30px;background:rgba(255,255,255,.1);border-radius:15px;overflow:hidden;position:relative;">
          <div id="fakeProgressBar" style="height:100%;background:linear-gradient(90deg,#ff4b6e,#ff869a);width:0%;transition:width 0.3s;border-radius:15px;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.85rem;font-weight:600;">
            <span id="fakeProgressText">0%</span>
          </div>
        </div>
      </div>
      <div id="fakeLoadingMessage" style="text-align:center;font-size:.9rem;color:rgba(255,255,255,.6);margin:20px 0;">
        Initializing verification protocols...
      </div>
      <button class="captcha-submit" id="submitFake" style="display:none;">Continue</button>
    </div>
  `;
  
  const messages = [
    'Initializing verification protocols...',
    'Scanning neural patterns...',
    'Analyzing behavioral data...',
    'Cross-referencing databases...',
    'Almost done... (just kidding)',
    'Verifying human consciousness...',
    'Finalizing verification...'
  ];
  
  let messageIndex = 0;
  const fakeInterval = setInterval(() => {
    fakeProgress += Math.random() * 15;
    if (fakeProgress > 95) fakeProgress = 95; // Never reaches 100 initially
    
    document.getElementById('fakeProgressBar').style.width = fakeProgress + '%';
    document.getElementById('fakeProgressText').textContent = Math.floor(fakeProgress) + '%';
    
    // Change message
    if (Math.random() > 0.7 && messageIndex < messages.length - 1) {
      messageIndex++;
      document.getElementById('fakeLoadingMessage').textContent = messages[messageIndex];
    }
    
    // Fake completion after frustrating delay
    if (fakeProgress >= 95 && !loadingComplete) {
      setTimeout(() => {
        // Reset to 0% - ULTRA FRUSTRATING
        fakeProgress = 0;
        document.getElementById('fakeProgressBar').style.width = '0%';
        document.getElementById('fakeProgressText').textContent = '0%';
        document.getElementById('fakeLoadingMessage').textContent = 'Verification failed. Restarting...';
        messageIndex = 0;
        
        // Actually complete after second attempt
        setTimeout(() => {
          clearInterval(fakeInterval);
          fakeProgress = 100;
          document.getElementById('fakeProgressBar').style.width = '100%';
          document.getElementById('fakeProgressText').textContent = '100%';
          document.getElementById('fakeLoadingMessage').textContent = 'Verification complete!';
          document.getElementById('submitFake').style.display = 'block';
          loadingComplete = true;
        }, 3000);
      }, 2000);
    }
  }, 800);
  
  document.getElementById('submitFake').addEventListener('click', () => {
    if (loadingComplete) {
      progress.textContent = `Challenge ${currentCaptchaIndex + 1} passed!`;
      setTimeout(() => advanceToNextCaptcha(), 1000);
    }
  });
}

// ────────────────── START ON PAGE LOAD ──────────────────
document.addEventListener('DOMContentLoaded', () => {
  initFaceRecognition();
});
