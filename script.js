// Initialize Three.js scene
const scene = new THREE.Scene();

// Boot sequence configuration
const bootSequenceText = [
    {
        header: "BG IG, a System-Act Ally",
        content: "Copyright (C) 2084-2108, Halden Electronics Inc."
    },
    {
        header: "CPU Type",
        content: "BORSON 300 CPU at 2500 MHz"
    },
    {
        header: "Memory test",
        content: "4521586k OK"
    },
    {
        header: "Boot Distribitioner Application v0.04",
        content: "Copyright (C) 2107 Distribitioner"
    },
    {
        content: "Detecting Sting X ROM"
    },
    {
        content: "Detecting Web LNV Extender"
    },
    {
        content: "Detecting Heartbeats OK"
    },
    {
        header: "UTGF Device Listening..",
        content: ""
    },
    {
        header: "Body    ID      Neural    Device Class",
        content: "----------------------------------------"
    },
    {
        content: "2       52      Jo152     H515"
    },
    {
        content: "2       52      Sa5155    H515"
    },
    {
        content: "2       52      Bo75      H515"
    },
    {
        content: "2       52      Eri510    H515"
    },
    {
        content: "1       36      Ell567    H515"
    },
    {
        content: "1       36      Jos912    H515"
    },
    {
        content: "0"
    }
];

// Terminal content configuration
const terminalContent = {
    home: "Brian Tram's Portfolio\n====================\nType 'help' to see available commands.\nType 'exit' to return to 3D view.\n",
    help: "Available Commands\n=================\nhelp     - Show this help menu\nhome     - Return to home page\nabout    - About me\nprojects - View my projects\ncontact  - Contact information\nexit     - Return to 3D view\n",
    about: "About Me\n========\nI am a software developer with a passion for creating interactive and engaging web experiences.\n",
    projects: "My Projects\n===========\n1. Portfolio Website (Current)\n2. Project 2\n3. Project 3\n",
    contact: "Contact Information\n===================\nEmail: example@email.com\nGitHub: github.com/username\nLinkedIn: linkedin.com/in/username\n"
};

// Load and set sky texture
const skyLoader = new THREE.TextureLoader();
const skyTexture = skyLoader.load('textures/roblox sky.jpeg');
scene.background = skyTexture;

// Create ground plane with Roblox baseplate appearance
const textureLoader = new THREE.TextureLoader();
const studTexture = textureLoader.load('textures/roblox stud.png', function(texture) {
    // Once texture is loaded, ensure it's using the correct color space
    texture.colorSpace = THREE.SRGBColorSpace;
    groundMaterial.needsUpdate = true;
});

// Make the texture repeat many times
studTexture.wrapS = THREE.RepeatWrapping;
studTexture.wrapT = THREE.RepeatWrapping;
studTexture.repeat.set(50, 50);
studTexture.encoding = THREE.sRGBEncoding;

const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xCCCCCC,
    map: studTexture,
    roughness: 0.5,
    metalness: 0.1,
    normalScale: new THREE.Vector2(1, 1)
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.4;
ground.receiveShadow = true;
scene.add(ground);

// Adjust lighting for better visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Increased ambient light
scene.add(ambientLight);

// Adjust sunlight for better visibility
const sunLight = new THREE.DirectionalLight(0xffffff, 2.5); // Increased intensity
sunLight.position.set(5, 10, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 50;
sunLight.shadow.camera.left = -10;
sunLight.shadow.camera.right = 10;
sunLight.shadow.camera.top = 10;
sunLight.shadow.camera.bottom = -10;
scene.add(sunLight);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.near = 0.3; // Increased from 0.1 to prevent seeing through models
camera.updateProjectionMatrix();
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "low-power"
});

// Enable shadow mapping
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1; // Slightly increased exposure

// Create audio elements for sounds
const bootupSound = new Audio('sounds/Boot Up.mp3');
const enterTerminalSound = new Audio('sounds/Enter Terminal.mp3');
const exitTerminalSound = new Audio('sounds/Exit Terminal.mp3');

// Create audio elements for typing sounds
const baseKeyboardSound = new Audio('sounds/old keyboard.mp3');
baseKeyboardSound.volume = 1;

// Create pitched versions of the keyboard sound with varied volumes
const keyboardSounds = [
    { pitch: 1.2, volume: 1.0 },    // Higher pitch, medium-loud
    { pitch: 1.3, volume: 1.0 },    // Even higher pitch, loudest
    { pitch: 1.1, volume: 0.9 },    // Slightly higher pitch, quieter
    { pitch: 1.15, volume: 1.0 }    // Between higher pitches, medium-loud
];

// Function to play random typing sound with slight random volume variation
function playRandomTypeSound() {
    const soundConfig = keyboardSounds[Math.floor(Math.random() * keyboardSounds.length)];
    const sound = new Audio('sounds/old keyboard.mp3');
    sound.preservesPitch = false;
    sound.playbackRate = soundConfig.pitch;
    const volumeVariation = 1 + (Math.random() * 0.2 - 0.1);
    sound.volume = 1.0;
    
    const playPromise = sound.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Audio play failed:", error);
        });
    }
}

// Create audio context for keyboard sounds
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Set up renderer
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('model-container').appendChild(renderer.domElement);

// Set up post-processing
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

// Add outline pass for glow effect
const outlinePass = new THREE.OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 2;
outlinePass.edgeThickness = 2;
outlinePass.visibleEdgeColor.set(0x00ffff);
outlinePass.hiddenEdgeColor.set(0x00ffff);
outlinePass.pulsePeriod = 0;
outlinePass.usePatternTexture = false;
outlinePass.depthTest = true;
outlinePass.depthFail = false;
composer.addPass(outlinePass);

// Create volumetric light cone geometry
function createLightCone(position) {
    const coneGeometry = new THREE.CylinderGeometry(0.1, 0.5, 2, 32, 20, true);
    const coneMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffee,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.copy(position);
    cone.rotation.x = Math.PI;
    return cone;
}

// Create pendant lamp geometry
function createPendantLamp(position) {
    const lampGroup = new THREE.Group();
    
    // Create the cable
    const cableGeometry = new THREE.CylinderGeometry(0.01, 0.01, 2, 8);
    const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 });
    const cable = new THREE.Mesh(cableGeometry, cableMaterial);
    cable.position.y = 1;
    
    // Create the lamp shade
    const shadeGeometry = new THREE.ConeGeometry(0.2, 0.3, 32, 1, true);
    const shadeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x303030,
        side: THREE.DoubleSide,
        metalness: 0.8,
        roughness: 0.2
    });
    const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
    shade.position.y = 0;
    
    // Create the light bulb (visible)
    const bulbGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const bulbMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffee,
        emissive: 0xffffee,
        emissiveIntensity: 2
    });
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.y = 0;
    
    // Create the actual light source
    const light = new THREE.SpotLight(0xffffee, 3);
    light.position.set(0, 0, 0);
    light.angle = Math.PI / 3;
    light.penumbra = 0.5;
    light.decay = 1.5;
    light.distance = 10;
    light.castShadow = true;
    
    // Improve shadow quality
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 10;
    light.shadow.focus = 1;
    
    // Add volumetric light cone
    const lightCone = createLightCone(new THREE.Vector3(0, 0, 0));
    
    // Add all elements to the group
    lampGroup.add(cable);
    lampGroup.add(shade);
    lampGroup.add(bulb);
    lampGroup.add(light);
    lampGroup.add(lightCone);
    
    // Position the entire lamp
    lampGroup.position.copy(position);
    
    return lampGroup;
}

// Create and add pendant lamps
const lamp1 = createPendantLamp(new THREE.Vector3(0, 5, 0));
scene.add(lamp1);

// Add a subtle front light for the screen
const frontLight = new THREE.DirectionalLight(0xffffff, 0.2);
frontLight.position.set(0, 1, 2);
frontLight.castShadow = false; // Don't cast shadows from this light
scene.add(frontLight);

// Create screen texture and material
const screenCanvas = document.createElement('canvas');
const screenCtx = screenCanvas.getContext('2d');
screenCanvas.width = 512;
screenCanvas.height = 512;

// Initialize with black screen
screenCtx.fillStyle = 'black';
screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);

const screenTexture = new THREE.CanvasTexture(screenCanvas);
screenTexture.needsUpdate = true; // Make sure texture updates initially

const screenMaterial = new THREE.MeshBasicMaterial({ 
    map: screenTexture,
    emissive: null,
    emissiveIntensity: 0
});

// Initialize state variables
let bootupProgress = 0;
let isBooting = false;
let showTerminal = false;
let currentCommand = '';
let cursorVisible = true;
let currentPage = 'home';
const terminalHistory = [];
let currentBootLine = -1;
let bootComplete = false;
let zoomTransitionActive = false;
let zoomProgress = 0;

// Terminal configuration
const terminalConfig = {
    fontSize: '16px',
    fontFamily: 'monospace',
    textColor: '#ffffff',
    backgroundColor: '#000',
    padding: '20px',
    lineHeight: '1.5'
};

// Get terminal content from HTML data attributes
const modelContainer = document.getElementById('model-container');
const terminalPages = {
    home: modelContainer.dataset.terminalHome,
    help: modelContainer.dataset.terminalHelp,
    about: modelContainer.dataset.terminalAbout,
    projects: modelContainer.dataset.terminalProjects,
    contact: modelContainer.dataset.terminalContact
};

// Function to wrap text
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let posY = y;

    for(let n = 0; n < words.length; n++) {
        let word = words[n];
        const spaceWidth = context.measureText(' ').width;
        
        // Handle long words that need to be broken up
        while (context.measureText(word).width > maxWidth) {
            // Find the maximum characters that can fit
            let splitIndex = 0;
            let testWidth = 0;
            while (splitIndex < word.length) {
                testWidth += context.measureText(word[splitIndex]).width;
                if (testWidth > maxWidth) break;
                splitIndex++;
            }
            
            // If we have an existing line, draw it first
            if (line) {
                context.fillText(line, x, posY);
                line = '';
                posY += lineHeight;
            }
            
            // Draw the portion of the word that fits
            const portion = word.substring(0, splitIndex);
            context.fillText(portion, x, posY);
            posY += lineHeight;
            
            // Update word to remaining characters
            word = word.substring(splitIndex);
            
            // Check if we've reached the bottom of the screen
            if (posY > screenCanvas.height - 40) {
                return posY;
            }
        }
        
        // Test if adding the word exceeds maxWidth
        const testLine = line + word + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && line !== '') {
            context.fillText(line, x, posY);
            line = word + ' ';
            posY += lineHeight;
            
            // Check if we've reached the bottom of the screen
            if (posY > screenCanvas.height - 40) {
                break;
            }
        }
        else {
            line = testLine;
        }
    }
    
    // Draw the last line if there's room
    if (posY <= screenCanvas.height - 40 && line) {
        context.fillText(line.trim(), x, posY);
    }
    return posY;
}

// Matrix rain effect characters
const matrixChars = null;

// Matrix rain configuration
let matrixDrops = null;
let matrixColumns = null;

// Add state tracking for terminal progress
let hasBootedBefore = false;
let lastTerminalState = {
    page: 'home',
    command: '',
    history: []
};

// Function to start boot sequence
function startBootSequence() {
    currentBootLine = -1;
    bootComplete = false;
    showTerminal = false;
    currentPage = '';
    
    setTimeout(() => {
        bootupSound.currentTime = 0;
        bootupSound.play();
        
        const bootDuration = bootupSound.duration * 1000;
        const lineDelay = bootDuration / bootSequenceText.length;
        
        function displayNextLine() {
            if (currentBootLine < bootSequenceText.length - 1) {
                currentBootLine++;
                updateBootScreen();
                
                if (currentBootLine < bootSequenceText.length - 1) {
                    setTimeout(displayNextLine, lineDelay);
                } else {
                    // Last line displayed
                    bootComplete = true;
                    hasBootedBefore = true;
                    // After boot completes, show terminal with home page
                    setTimeout(() => {
                        showTerminal = true;
                        currentPage = 'home';
                        currentCommand = '';
                        enterTerminalSound.currentTime = 0;
                        enterTerminalSound.play();
                        updateBootScreen();
                    }, 1000);
                }
            }
        }
        
        displayNextLine();
    }, 500);
}

// Initialize terminal view
function initTerminal() {
    const terminal = document.createElement('div');
    terminal.id = 'terminal';
    terminal.style.position = 'fixed';
    terminal.style.top = '0';
    terminal.style.left = '0';
    terminal.style.width = '100%';
    terminal.style.height = '100%';
    terminal.style.backgroundColor = terminalConfig.backgroundColor;
    terminal.style.color = terminalConfig.textColor;
    terminal.style.fontFamily = terminalConfig.fontFamily;
    terminal.style.fontSize = terminalConfig.fontSize;
    terminal.style.padding = terminalConfig.padding;
    terminal.style.lineHeight = terminalConfig.lineHeight;
    terminal.style.overflow = 'hidden';
    terminal.style.zIndex = '999';
    terminal.style.opacity = '0';
    
    document.body.appendChild(terminal);
    
    // Fade in terminal
    let opacity = 0;
    const fadeIn = setInterval(() => {
        opacity += 0.1;
        terminal.style.opacity = opacity;
        if (opacity >= 1) {
            clearInterval(fadeIn);
            startTerminalSequence();
        }
    }, 100);
}

// Start terminal sequence
function startTerminalSequence() {
    const terminal = document.getElementById('terminal');
    let currentContent = '';
    
    // Display each line of the boot sequence with typing effect
    bootSequenceText.forEach((line, index) => {
        setTimeout(() => {
            currentContent += line.header + ': ' + line.content + '\n';
            terminal.textContent = currentContent;
            playRandomTypeSound();
            
            // When sequence is complete, add command prompt
            if (index === bootSequenceText.length - 1) {
                setTimeout(() => {
                    currentContent += '\n> ';
                    terminal.textContent = currentContent;
                    terminal.setAttribute('data-content', currentContent);
                    makeTerminalInteractive();
                }, 1000);
            }
        }, index * 1000);
    });
}

// Make terminal interactive
function makeTerminalInteractive() {
    const terminal = document.getElementById('terminal');
    let currentInput = '';
    
    document.addEventListener('keydown', (e) => {
        if (!bootComplete) return;
        
        if (e.key === 'Enter') {
            handleTerminalCommand(currentInput);
            currentInput = '';
        } else if (e.key === 'Backspace') {
            currentInput = currentInput.slice(0, -1);
        } else if (e.key.length === 1) {
            currentInput += e.key;
        }
        
        const baseContent = terminal.getAttribute('data-content');
        terminal.textContent = baseContent + currentInput;
    });
}

// Handle terminal commands
function handleTerminalCommand(command) {
    const terminal = document.getElementById('terminal');
    const baseContent = terminal.getAttribute('data-content');
    let newContent = baseContent + command + '\n';
    
    switch(command.toLowerCase().trim()) {
        case 'help':
            newContent += 'Available commands:\n';
            newContent += '  help     - Show this help menu\n';
            newContent += '  clear    - Clear terminal\n';
            newContent += '  exit     - Exit terminal mode\n';
            break;
            
        case 'clear':
            newContent = '> ';
            break;
            
        case 'exit':
            exitTerminalMode();
            return;
            
        default:
            newContent += 'Command not recognized. Type "help" for available commands.\n';
    }
    
    newContent += '> ';
    terminal.textContent = newContent;
    terminal.setAttribute('data-content', newContent);
}

// Exit terminal mode and zoom out to 3D view
function exitTerminalMode() {
    const terminal = document.getElementById('terminal');
    
    // Fade out terminal
    let opacity = 1;
    const fadeOut = setInterval(() => {
        opacity -= 0.1;
        terminal.style.opacity = opacity;
        if (opacity <= 0) {
            clearInterval(fadeOut);
            terminal.remove();
            zoomOut();
        }
    }, 100);
}

// Zoom out to 3D view
function zoomOut() {
    zoomTransitionActive = true;
    zoomProgress = 1;
    
    function animateZoomOut() {
        if (!zoomTransitionActive) return;
        
        zoomProgress -= 0.02;
        
        if (zoomProgress >= 0) {
            camera.position.z = 5 * (1 - zoomProgress);
            camera.position.y = 2 * (1 - zoomProgress);
            requestAnimationFrame(animateZoomOut);
        } else {
            zoomTransitionActive = false;
            resetCamera();
        }
    }
    
    animateZoomOut();
}

// Reset camera to original position
function resetCamera() {
    camera.position.set(0, 2, 5);
        camera.lookAt(0, 0, 0);
}

// Add animation state tracking
let currentCameraAnimation = null;

// Modify startZoomOut to handle animation state properly
function startZoomOut() {
    // Cancel any existing camera animation
    if (currentCameraAnimation) {
        cancelAnimationFrame(currentCameraAnimation);
        currentCameraAnimation = null;
    }

    isZoomedIn = false;
    isAnimating = true;
    isDragging = false;
    
    // Save current terminal state but clear the current command
    lastTerminalState = {
        page: currentPage,
        command: '',
        history: [...terminalHistory]
    };
    currentCommand = '';
    
    const startTime = performance.now();
    const duration = zoomDuration;
    
    // Store initial camera position and calculate end position
    const startPosition = camera.position.clone();
    const endPosition = new THREE.Vector3(
        Math.sin(lastOrbitalState.rotationX) * orbitRadius,
        2 + Math.sin(lastOrbitalState.rotationY) * 2,
        Math.cos(lastOrbitalState.rotationX) * orbitRadius
    );
    
    function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        // Fade out terminal
        if (progress <= 0.5) {
            const fadeProgress = 1 - (progress * 2);
            terminalContainer.style.opacity = fadeProgress;
        }
        
        // Smooth camera transition
        camera.position.lerpVectors(startPosition, endPosition, eased);
        camera.lookAt(0, 0, 0);
        
        if (progress < 1) {
            currentCameraAnimation = requestAnimationFrame(animate);
        } else {
            currentCameraAnimation = null;
            isAnimating = false;
            showTerminal = false;
            terminalContainer.style.pointerEvents = 'none';
            
            // Ensure camera is at final position
            camera.position.copy(endPosition);
            camera.lookAt(0, 0, 0);
            
            // Restore orbital camera controls
            currentRotationX = lastOrbitalState.rotationX;
            currentRotationY = lastOrbitalState.rotationY;
            targetRotationX = lastOrbitalState.rotationX;
            targetRotationY = lastOrbitalState.rotationY;
        }
    }
    
    currentCameraAnimation = requestAnimationFrame(animate);
}

// Modify transitionToFrontView to handle animation state
function transitionToFrontView() {
    // Cancel any existing camera animation
    if (currentCameraAnimation) {
        cancelAnimationFrame(currentCameraAnimation);
        currentCameraAnimation = null;
    }

    const startTime = performance.now();
    const duration = zoomDuration * 0.5;
    
    function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        camera.position.lerpVectors(
            camera.position,
            cameraStates.frontView.position,
            eased
        );
        camera.lookAt(cameraStates.frontView.lookAt);
        
        if (progress < 1) {
            currentCameraAnimation = requestAnimationFrame(animate);
        } else {
            currentCameraAnimation = null;
            startZoomIn();
        }
    }
    
    currentCameraAnimation = requestAnimationFrame(animate);
}

// Modify animate function to respect animation state
function animate(currentTime) {
    requestAnimationFrame(animate);
    
    // Only apply orbital movement when no animation is running
    if (!currentCameraAnimation && !isZoomedIn) {
        currentRotationX += (targetRotationX - currentRotationX) * orbitSpeed;
        currentRotationY += (targetRotationY - currentRotationY) * orbitSpeed;

        camera.position.x = Math.sin(currentRotationX) * orbitRadius;
        camera.position.z = Math.cos(currentRotationX) * orbitRadius;
        camera.position.y = 2 + Math.sin(currentRotationY) * 2;

        const minDistance = 1.5;
        const currentDistance = Math.sqrt(
            camera.position.x * camera.position.x +
            camera.position.y * camera.position.y +
            camera.position.z * camera.position.z
        );

        if (currentDistance < minDistance) {
            const scale = minDistance / currentDistance;
            camera.position.multiplyScalar(scale);
        }

        camera.lookAt(0, 0, 0);
    }
    
    // Update bootup animation
    if (isBooting) {
        const progress = bootupSound.currentTime / bootupSound.duration;
        bootupProgress = Math.min(progress, 1);
        
        if (bootupProgress >= 1) {
            bootupProgress = 1;
            isBooting = false;
        }
        updateBootScreen();
    }
    
    // Only update screen texture when not animating
    if (!currentCameraAnimation) {
        screenTexture.needsUpdate = true;
    }
    
    composer.render();
}

// Initialize everything
function init() {
    // Only start the animation loop, don't start bootup
animate();
}

// Start only the animation when the page loads
window.addEventListener('load', init);

// Update window resize handler
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    outlinePass.resolution.set(width, height);
});

// Add keyboard event handling
window.addEventListener('keydown', (event) => {
    if (showTerminal) {
        if (event.key === 'Enter') {
            handleCommand(currentCommand);
            currentCommand = '';
            // Play enter key with higher pitch and volume
            const sound = new Audio('sounds/old keyboard.mp3');
            sound.preservesPitch = false;
            sound.playbackRate = 1.2;
            sound.volume = 1.0;
            sound.play();
        } else if (event.key === 'Backspace') {
            currentCommand = currentCommand.slice(0, -1);
            // Play backspace with higher pitch
            const sound = new Audio('sounds/old keyboard.mp3');
            sound.preservesPitch = false;
            sound.playbackRate = 1.25;
            sound.volume = 1.0;
            sound.play();
        } else if (event.key.length === 1) {
            currentCommand += event.key;
            playRandomTypeSound();
        }
        updateBootScreen();
    }
});

// Add command handling function
function handleCommand(cmd) {
    switch(cmd.toLowerCase().trim()) {
        case 'help':
        case 'home':
        case 'about':
        case 'projects':
        case 'contact':
            currentPage = cmd.toLowerCase().trim();
            currentCommand = ''; // Clear command after execution
            break;
        case 'clear':
            terminalHistory.length = 0;
            currentCommand = ''; // Clear command after execution
            break;
        case 'exit':
            currentCommand = ''; // Clear command before starting exit animation
            exitTerminalSound.currentTime = 0;
            exitTerminalSound.play();
            startZoomOut();
            break;
        default:
            if (cmd) {
                terminalHistory.push(`Unknown command: ${cmd}`);
                currentCommand = ''; // Clear command after execution
            }
    }
    
    updateBootScreen();
}

// Add cursor blink
setInterval(() => {
    if (showTerminal) {
        cursorVisible = !cursorVisible;
        updateBootScreen();
    }
}, 500);

// Create UI elements
function createUIElements() {
    // Create Goku icon button (separate)
    const gokuButton = document.createElement('button');
    gokuButton.style.cssText = `
        position: fixed;
        top: 11px;
        left: 15px;
        width: 45px;
        height: 45px;
        background: rgba(0, 0, 0, 0.8);
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        padding: 0;
    `;
    gokuButton.innerHTML = `
        <div class="hover-circle"></div>
        <img src="textures/goku icon.webp" style="width: 36px; height: 36px; border-radius: 50%;">
    `;

    // Create container div for the menu/chat button group
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = `
        position: fixed;
        top: 11px;
        left: 68px;
        display: flex;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 50px;
        padding: 0;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        height: 45px;
        width: 96px;
    `;

    // Create menu button
    const menuButton = document.createElement('button');
    menuButton.innerHTML = `
        <div class="hover-circle"></div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;
    menuButton.style.cssText = `
        position: relative;
        background: transparent;
        border: none;
        padding: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 53px;
        height: 48px;
        transition: background 0.2s;
        border-radius: 50px 0 0 50px;
        overflow: hidden;
    `;

    // Create chat button
    const chatButton = document.createElement('button');
    chatButton.innerHTML = `
        <div class="hover-circle"></div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    chatButton.style.cssText = `
        position: relative;
        background: transparent;
        border: none;
        padding: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 53px;
        height: 48px;
        transition: background 0.2s;
        border-radius: 0 50px 50px 0;
        overflow: hidden;
    `;

    // Create player list widget
    const playerList = document.createElement('div');
    playerList.style.cssText = `
        position: fixed;
        top: 5.7%;
        right: 5px;
        background: rgba(50, 60, 70, 0.95);
        border-radius: 8px;
        padding: 8px 12px;
        z-index: 1000;
        width: 165px; /* Set explicit width */
        height: 64px; /* Set explicit height */
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
        transform-origin: right;
    `;

    // Create header container
    const headerContainer = document.createElement('div');
    headerContainer.style.cssText = `
        display: flex;
        margin-bottom: 4px;
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
        background: transparent;
        border: none;
        color: #8b8b8b;
        cursor: pointer;
        padding: 2px;
        font-size: 16px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: -2px;
    `;
    closeButton.innerHTML = '×';

    // Create player entry container
    const playerEntry = document.createElement('div');
    playerEntry.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
    `;

    // Create player icon
    const playerIcon = document.createElement('div');
    playerIcon.style.cssText = `
        width: 24px;
        height: 24px;
        background: #5F6368;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        font-size: 12px;
        color: white;
        text-transform: uppercase;
    `;
    playerIcon.textContent = 'B';

    // Create player name
    const playerName = document.createElement('span');
    playerName.style.cssText = `
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 400;
    `;
    playerName.textContent = 'brian';

    // Assemble all elements
    headerContainer.appendChild(closeButton);
    playerEntry.appendChild(playerIcon);
    playerEntry.appendChild(playerName);
    playerList.appendChild(headerContainer);
    playerList.appendChild(playerEntry);
    playerList.classList.add('ui-element');

    // Add Tab key toggle functionality
    let isPlayerListVisible = true;
    
    function hidePlayerList() {
        playerList.style.transform = 'translateX(calc(100% + 15px))';
        playerList.style.opacity = '0';
    }
    
    function showPlayerList() {
        playerList.style.transform = 'translateX(0)';
        playerList.style.opacity = '1';
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
            event.preventDefault(); // Prevent default tab behavior
            isPlayerListVisible = !isPlayerListVisible;
            if (isPlayerListVisible) {
                showPlayerList();
            } else {
                hidePlayerList();
            }
        }
    });

    // Add click handler for close button
    closeButton.addEventListener('click', () => {
        isPlayerListVisible = false;
        hidePlayerList();
    });

    // Add styles for hover circle
    const style = document.createElement('style');
    style.textContent = `
        .hover-circle {
            position: absolute;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0);
            transition: background 0.2s, transform 0.2s;
            transform: scale(0);
        }
        button:hover .hover-circle {
            background: rgba(255, 255, 255, 0.1);
            transform: scale(1);
        }
    `;
    document.head.appendChild(style);

    // Add hover effects
    const addHoverEffect = (button) => {
        button.addEventListener('mouseover', () => {
            const circle = button.querySelector('.hover-circle');
            circle.style.transform = 'scale(1)';
        });
        button.addEventListener('mouseout', () => {
            const circle = button.querySelector('.hover-circle');
            circle.style.transform = 'scale(0)';
        });
    };

    addHoverEffect(gokuButton);
    addHoverEffect(menuButton);
    addHoverEffect(chatButton);

    // Add click handlers
    gokuButton.addEventListener('click', () => {
        console.log('Goku clicked');
        // Add your Goku button functionality here
    });

    menuButton.addEventListener('click', () => {
        console.log('Menu clicked');
        // Add your menu functionality here
    });

    chatButton.addEventListener('click', () => {
        console.log('Chat clicked');
        // Add your chat functionality here
    });

    // Remove any existing UI elements first
    const existingUI = document.querySelectorAll('.ui-element, .ui-container, .logo, .button-container, .ui-button');
    existingUI.forEach(element => element.remove());

    // Add classes for easy removal later
    gokuButton.classList.add('ui-element');
    buttonGroup.classList.add('ui-element');

    // Append all UI elements
    buttonGroup.appendChild(menuButton);
    buttonGroup.appendChild(chatButton);
    document.body.appendChild(gokuButton);
    document.body.appendChild(buttonGroup);
    document.body.appendChild(playerList);
}

// Call createUIElements after the scene is set up
document.addEventListener('DOMContentLoaded', () => {
    // Remove any existing UI elements first
    const existingUI = document.querySelectorAll('.ui-element, .ui-container, .logo, .button-container, .ui-button');
    existingUI.forEach(element => element.remove());
    
    // Create new UI
    createUIElements();
});

// Modify updateBootScreen to handle terminal transition better
function updateBootScreen() {
    // Don't update if we're in the middle of zooming out
    if (isAnimating && !isZoomedIn) return;

    // Clear both screens to black first
    screenCtx.fillStyle = 'black';
    screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
    terminalCtx.fillStyle = 'black';
    terminalCtx.fillRect(0, 0, terminalCanvas.width, terminalCanvas.height);
    
    // Set up text style for both contexts
    screenCtx.font = '16px "Courier New", monospace';
    screenCtx.fillStyle = '#ffffff';
    terminalCtx.font = '16px "Courier New", monospace';
    terminalCtx.fillStyle = '#ffffff';
    
    let screenYPos = 40;
    let terminalYPos = 40;
    const lineHeight = 20;
    const screenMaxWidth = screenCanvas.width - 40;
    const terminalMaxWidth = terminalCanvas.width - 40;
    const margin = 20;

    if (!bootComplete || !showTerminal) {
        // Draw boot sequence
        for (let i = 0; i <= currentBootLine; i++) {
            const line = bootSequenceText[i];
            if (line) {
                let text = '';
                if (line.header) {
                    text = line.header;
                    if (line.content) {
                        text += ": " + line.content;
                    }
                } else {
                    text = line.content;
                }
                
                // Draw on both screens
                screenYPos = wrapText(screenCtx, text, margin, screenYPos, screenMaxWidth, lineHeight);
                terminalYPos = wrapText(terminalCtx, text, margin, terminalYPos, terminalMaxWidth, lineHeight);
                screenYPos += lineHeight;
                terminalYPos += lineHeight;
            }
        }
    } else {
        // Draw terminal content
        const pageContent = terminalContent[currentPage];
        if (pageContent) {
            const lines = pageContent.split('\n');
            
            for (const line of lines) {
                if (line.trim() === '') {
                    screenYPos += lineHeight;
                    terminalYPos += lineHeight;
                    continue;
                }
                
                // Draw on both screens
                screenYPos = wrapText(screenCtx, line, margin, screenYPos, screenMaxWidth, lineHeight);
                terminalYPos = wrapText(terminalCtx, line, margin, terminalYPos, terminalMaxWidth, lineHeight);
                screenYPos += lineHeight;
                terminalYPos += lineHeight;
            }

            // Draw command prompt
            const prompt = '> ';
            screenCtx.fillText(prompt + currentCommand, margin, screenYPos);
            terminalCtx.fillText(prompt + currentCommand, margin, terminalYPos);
            
            if (cursorVisible) {
                const promptWidth = screenCtx.measureText(prompt + currentCommand).width;
                screenCtx.fillText('█', margin + promptWidth, screenYPos);
                terminalCtx.fillText('█', margin + promptWidth, terminalYPos);
            }
        }
    }
    
    screenTexture.needsUpdate = true;
}

// Modify startZoomIn function to maintain screen state
function startZoomIn() {
    const startTime = performance.now();
    const duration = zoomDuration * 0.5;
    
    // Only clear screens if this is the first boot
    if (!hasBootedBefore) {
        screenCtx.fillStyle = 'black';
        screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
        terminalCtx.fillStyle = 'black';
        terminalCtx.fillRect(0, 0, terminalCanvas.width, terminalCanvas.height);
    }
    screenTexture.needsUpdate = true;
    
    function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        // Zoom in from front view to close-up
        camera.position.lerpVectors(
            cameraStates.frontView.position,
            cameraStates.zoomedIn.position,
            eased
        );
        camera.lookAt(cameraStates.zoomedIn.lookAt);
        
        // Fade to black and show 2D terminal container
        if (progress > 0.5) {
            const fadeProgress = (progress - 0.5) * 2;
            terminalContainer.style.opacity = fadeProgress;
            terminalContainer.style.pointerEvents = 'auto';
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Once fully zoomed in, either start boot or resume terminal
            if (!hasBootedBefore) {
                isBooting = true;
                startBootSequence();
            } else {
                // Resume previous terminal state
                showTerminal = true;
                currentPage = lastTerminalState.page;
                currentCommand = lastTerminalState.command;
                terminalHistory = [...lastTerminalState.history];
                enterTerminalSound.currentTime = 0;
                enterTerminalSound.play();
                updateBootScreen();
            }
        }
    }
    
    animate();
}

// Variables for camera animation
let isAnimating = false;
let animationStartTime = 0;
let isZoomedIn = false;

// Add new camera state for direct front view
const cameraStates = {
    default: {
        position: new THREE.Vector3(2, 2, 4),
        lookAt: new THREE.Vector3(0, 0, 0)
    },
    frontView: {
        position: new THREE.Vector3(0, 0.4, 1.5), // Directly in front of screen
        lookAt: new THREE.Vector3(0, 0.4, 0)  // Look at center of screen
    },
    zoomedIn: {
        position: new THREE.Vector3(0, 0.4, 0.1), // Very close to screen
        lookAt: new THREE.Vector3(0, 0.4, 0)  // Look at center of screen
    }
};

// Animation settings
const zoomDuration = 1500;

// Raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

// Load the table model first
const tableLoader = new THREE.GLTFLoader();
tableLoader.load(
    'models/table/scene.gltf',
    function (gltf) {
        const table = gltf.scene;
        scene.add(table);
        
        // Center and scale the table
        const box = new THREE.Box3().setFromObject(table);
        const center = box.getCenter(new THREE.Vector3());
        table.position.sub(center);
        
        // Scale the table - calculate base scale
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const baseScale = 1.5 / maxDim; // Reduced from 1.9 to make table smaller
        
        // Apply wider scale for length and width, keep height at base scale
        table.scale.set(
            baseScale * 1.5,  // length - 50% wider
            baseScale,        // height - keep original
            baseScale * 1.5   // width - 50% wider
        );

        // Move table back and center
        table.position.z -= 0.5; // Move table back
        table.position.x = 0; // Center horizontally

        // Enable shadows for the table
        table.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.isTable = true;
            }
        });

        // Load the computer model after the table is loaded
        const computerLoader = new THREE.GLTFLoader();
        computerLoader.load(
            'models/computer/scene.gltf',
            function (gltf) {
                const computer = gltf.scene;
                scene.add(computer);
                
                // Center and rotate the computer
                const computerBox = new THREE.Box3().setFromObject(computer);
                const computerCenter = computerBox.getCenter(new THREE.Vector3());
                computer.position.sub(computerCenter);
                computer.rotation.y = Math.PI / 2;
                
                // Scale the computer
                const computerSize = computerBox.getSize(new THREE.Vector3());
                const computerMaxDim = Math.max(computerSize.x, computerSize.y, computerSize.z);
                const computerScale = 2.0 / computerMaxDim;
                computer.scale.multiplyScalar(computerScale);

                // Position table below computer
                const tableHeight = size.y * baseScale;
                table.position.y = computer.position.y - (tableHeight / 2) - (computerSize.y * computerScale / 2);

                // Center computer horizontally and move back
                computer.position.x = 0;
                computer.position.z -= 0.8; // Move computer back to match table

                // Enable shadows and set up materials for the computer
                computer.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material.metalness = 0.3;
                        child.material.roughness = 0.7;
                        // Tag the entire computer for interaction
                        child.userData.isComputer = true;
                        if (child.name.toLowerCase().includes('screen') || 
                            child.material.name.toLowerCase().includes('screen')) {
                            child.material = screenMaterial;
                        }
                    }
                });

                // Add event listeners
                window.addEventListener('click', onClick);
                window.addEventListener('mousemove', onMouseMove);
            },
            function (xhr) {
                console.log('Computer: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('An error occurred while loading the computer model:', error);
            }
        );
    },
    function (xhr) {
        console.log('Table: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error occurred while loading the table model:', error);
    }
);

// Modify onClick function to handle re-entry
function onClick(event) {
    if (isAnimating) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    const computerIntersect = intersects.find(intersect => 
        intersect.object.userData.isComputer
    );

    if (computerIntersect) {
        isAnimating = true;
        animationStartTime = performance.now();
        isZoomedIn = true;
        
        // Store current camera state before transitioning
        lastOrbitalState.position.copy(camera.position);
        lastOrbitalState.rotationX = currentRotationX;
        lastOrbitalState.rotationY = currentRotationY;
        
        // First transition to front view
        transitionToFrontView();
    }
}

function onMouseMove(event) {
    // Don't show hover effects when zoomed in
    if (isZoomedIn) {
        selectedObject = null;
        outlinePass.selectedObjects = [];
        return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    // Find first intersection with any computer part
    const computerIntersect = intersects.find(intersect => 
        intersect.object.userData.isComputer
    );

    if (computerIntersect) {
        // Get the root computer object for highlighting the entire model
        let rootObject = computerIntersect.object;
        while (rootObject.parent && !rootObject.parent.isScene) {
            rootObject = rootObject.parent;
        }
        selectedObject = rootObject;
        outlinePass.selectedObjects = [selectedObject];
    } else {
        selectedObject = null;
        outlinePass.selectedObjects = [];
    }
}

// Store the last orbital camera state
let lastOrbitalState = {
    position: new THREE.Vector3(),
    rotationX: 0,
    rotationY: 0
};

// Modify animateCamera function for zoom out
function animateCamera(currentTime) {
    if (!isAnimating) return;

    const elapsed = currentTime - animationStartTime;
    const progress = Math.min(elapsed / zoomDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    if (!isZoomedIn) {
        // Zooming out - restore orbital state
        const startPosition = cameraStates.zoomedIn.position.clone();
        const endPosition = new THREE.Vector3();
        
        // Calculate end position based on stored rotation
        endPosition.x = Math.sin(lastOrbitalState.rotationX) * orbitRadius;
        endPosition.z = Math.cos(lastOrbitalState.rotationX) * orbitRadius;
        endPosition.y = 2 + Math.sin(lastOrbitalState.rotationY) * 2;
        
        camera.position.lerpVectors(startPosition, endPosition, eased);
        camera.lookAt(0, 0, 0);
        
        // Fade out 2D terminal
        if (progress < 0.5) {
            const fadeProgress = 1 - (progress * 2);
            terminalContainer.style.opacity = fadeProgress;
            terminalContainer.style.pointerEvents = 'none';
        }
        
        // Restore rotation values
        if (progress >= 1) {
            currentRotationX = lastOrbitalState.rotationX;
            currentRotationY = lastOrbitalState.rotationY;
            targetRotationX = lastOrbitalState.rotationX;
            targetRotationY = lastOrbitalState.rotationY;
            isAnimating = false;
        }
    }
}

// Add mouse movement variables
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
const orbitRadius = 4.5; // Distance from center
const orbitSpeed = 0.15; // Speed of rotation
const maxTiltY = 0.5; // Maximum up/down tilt
const rotationSpeed = 0.005; // Reduced from 0.01 to make panning slower

// Update mouse controls
document.addEventListener('mousedown', (event) => {
    if (event.button === 0 && !isZoomedIn && !isAnimating) { // Only allow dragging when not animating
        isDragging = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('mousemove', (event) => {
    if (isDragging && !isZoomedIn && !isAnimating) { // Only update rotation when not animating
        const deltaX = event.clientX - previousMouseX;
        const deltaY = event.clientY - previousMouseY;
        
        targetRotationX += deltaX * rotationSpeed;
        targetRotationY = Math.max(-maxTiltY, Math.min(maxTiltY, targetRotationY + deltaY * rotationSpeed));
        
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

// Prevent dragging from selecting text
document.addEventListener('dragstart', (event) => {
    if (isDragging) {
        event.preventDefault();
    }
});

// Add terminal container for 2D view
const terminalContainer = document.createElement('div');
terminalContainer.id = 'terminal-container';
terminalContainer.style.position = 'fixed';
terminalContainer.style.top = '0';
terminalContainer.style.left = '0';
terminalContainer.style.width = '100%';
terminalContainer.style.height = '100%';
terminalContainer.style.backgroundColor = '#000';
terminalContainer.style.zIndex = '1000';
terminalContainer.style.opacity = '0';
terminalContainer.style.pointerEvents = 'none';
document.body.appendChild(terminalContainer);

// Add terminal canvas for 2D view
const terminalCanvas = document.createElement('canvas');
terminalCanvas.id = 'terminal-canvas';
terminalCanvas.style.position = 'absolute';
terminalCanvas.style.top = '50%';
terminalCanvas.style.left = '50%';
terminalCanvas.style.transform = 'translate(-50%, -50%)';
terminalCanvas.style.width = '80%';
terminalCanvas.style.height = '80%';
terminalContainer.appendChild(terminalCanvas);

// Get terminal canvas context
const terminalCtx = terminalCanvas.getContext('2d');

// Update terminal canvas size
function updateTerminalCanvasSize() {
    terminalCanvas.width = terminalCanvas.offsetWidth;
    terminalCanvas.height = terminalCanvas.offsetHeight;
    updateTerminalContent();
}

// Update terminal content
function updateTerminalContent() {
    terminalCtx.fillStyle = '#000';
    terminalCtx.fillRect(0, 0, terminalCanvas.width, terminalCanvas.height);
    
    terminalCtx.font = '16px "Courier New", monospace';
    terminalCtx.fillStyle = '#ffffff';
    
    let yPos = 40;
    const lineHeight = 20;
    const maxWidth = terminalCanvas.width - 40;
    const margin = 20;
    
    // Draw page content
    const pageContent = terminalContent[currentPage];
    const lines = pageContent.split('\n');
    
    for (const line of lines) {
        if (line.trim() === '') {
            yPos += lineHeight;
            continue;
        }
        yPos = wrapText(terminalCtx, line, margin, yPos, maxWidth, lineHeight);
        yPos += lineHeight;
        
        if (yPos > terminalCanvas.height - 40) {
            break;
        }
    }

    // Handle command line with cursor
    if (yPos <= terminalCanvas.height - 40) {
        const prompt = '> ';
        terminalCtx.fillText(prompt + currentCommand, margin, yPos);
        
        if (cursorVisible) {
            const promptWidth = terminalCtx.measureText(prompt + currentCommand).width;
            terminalCtx.fillText('█', margin + promptWidth, yPos);
        }
    }
}

// Update window resize handler
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    outlinePass.resolution.set(width, height);
    
    updateTerminalCanvasSize();
});

// Initialize terminal canvas size
updateTerminalCanvasSize();
