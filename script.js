// Initialize Three.js scene
const scene = new THREE.Scene();
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

// Create audio element for boot sound
const bootupSound = new Audio('sounds/computer bootup.mp3');

// Create audio elements for typing sounds
const baseKeyboardSound = new Audio('sounds/old keyboard.mp3');
baseKeyboardSound.volume = 1;

// Create pitched versions of the keyboard sound with varied volumes
const keyboardSounds = [
    { pitch: 1, volume: 1.0 },     // Normal pitch, medium-loud
    { pitch: 1.1, volume: 1.0 },   // Higher pitch, loudest
    { pitch: 0.9, volume: 0.9 },    // Lower pitch, quieter
    { pitch: 0.95, volume: 1.0 }    // Between normal and low, medium-loud
];

// Function to play random typing sound with slight random volume variation
function playRandomTypeSound() {
    const soundConfig = keyboardSounds[Math.floor(Math.random() * keyboardSounds.length)];
    const sound = new Audio('sounds/old keyboard.mp3');
    sound.preservesPitch = false;
    sound.playbackRate = soundConfig.pitch;
    // Add slight random variation to volume (-10% to +10%)
    const volumeVariation = 1 + (Math.random() * 0.2 - 0.1);
    sound.volume = 1.0; // Maximum volume
    
    // Ensure the sound plays
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

// Add bloom effect for light rays
const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,  // bloom strength
    0.4,  // radius
    0.85  // threshold
);
composer.addPass(bloomPass);

// Add outline pass for glow effect
const outlinePass = new THREE.OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
);
outlinePass.edgeStrength = 2;
outlinePass.edgeGlow = 0.5;
outlinePass.edgeThickness = 1;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0xffffff);
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
const screenTexture = new THREE.CanvasTexture(screenCanvas);
const screenMaterial = new THREE.MeshBasicMaterial({ 
    map: screenTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0.2
});

let bootupProgress = 0;
let isBooting = false; // Start as false, will be triggered by click

// Terminal state variables
let showTerminal = false;
let currentCommand = '';
let cursorVisible = true;
let currentPage = 'home';
const terminalHistory = [];

// Get terminal content from HTML data attributes
const modelContainer = document.getElementById('model-container');
const terminalPages = {
    home: modelContainer.dataset.terminalHome,
    help: modelContainer.dataset.terminalHelp,
    about: modelContainer.dataset.terminalAbout,
    projects: modelContainer.dataset.terminalProjects,
    contact: modelContainer.dataset.terminalContact
};

function updateBootScreen() {
    screenCtx.fillStyle = 'black';
    screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
    
    if (!showTerminal) {
        if (isBooting || bootupProgress >= 1) {
            // Set up retro text style
            screenCtx.fillStyle = '#ffffff';
            screenCtx.font = 'bold 32px "Courier New", monospace';
            screenCtx.fillText('LOADING...', 100, 200);
            
            // Display percentage
            const percent = Math.floor(bootupProgress * 100);
            screenCtx.fillText(percent + '%', 400, 200);
            
            // Draw retro progress bar border
            const barWidth = 300;
            const barHeight = 30;
            const barX = 100;
            const barY = 220;
            
            // Outer border (2px thick)
            screenCtx.fillStyle = '#ffffff';
            screenCtx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
            screenCtx.fillStyle = 'black';
            screenCtx.fillRect(barX, barY, barWidth, barHeight);
            
            // Draw segmented progress
            const segments = 20;
            const segmentWidth = barWidth / segments;
            const filledSegments = Math.floor(bootupProgress * segments);
            
            screenCtx.fillStyle = '#ffffff';
            for (let i = 0; i < filledSegments; i++) {
                screenCtx.fillRect(
                    barX + (i * segmentWidth),
                    barY,
                    segmentWidth - 2,
                    barHeight
                );
            }

            if (bootupProgress >= 1) {
                setTimeout(() => {
                    showTerminal = true;
                    currentPage = 'home';
                    updateBootScreen();
                }, 1000);
            }
        }
    } else {
        // Draw terminal interface
        screenCtx.font = '16px "Courier New", monospace';
        screenCtx.fillStyle = '#ffffff';
        
        // Draw terminal content
        let yPos = 40;
        const lineHeight = 20;
        
        // Draw page content
        const pageContent = terminalPages[currentPage];
        const lines = pageContent.split('\n');
        lines.forEach(line => {
            screenCtx.fillText(line, 20, yPos);
            yPos += lineHeight;
        });

        // Draw command line
        yPos += lineHeight;
        screenCtx.fillText('> ' + currentCommand + (cursorVisible ? '█' : ''), 20, yPos);
    }
    
    screenTexture.needsUpdate = true;
}

// Set initial camera position
camera.position.set(2, 2, 4);
camera.lookAt(0, 0, 0);

// Variables for camera animation
let isAnimating = false;
let animationStartTime = 0;
let isZoomedIn = false;

// Define the two camera states
const cameraStates = {
    default: {
        position: new THREE.Vector3(2, 2, 4),
        lookAt: new THREE.Vector3(0, 0, 0)
    },
    zoomedIn: {
        position: new THREE.Vector3(0.05, 0.4, 0.32),
        lookAt: new THREE.Vector3(0.05, 0.4, 0)
    }
};

// Animation settings
const zoomDuration = 1000;

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

                // Enable shadows for the computer
                computer.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material.metalness = 0.3;
                        child.material.roughness = 0.7;
                        if (child.name.toLowerCase().includes('screen') || 
                            child.material.name.toLowerCase().includes('screen')) {
                            child.userData.isScreen = true;
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

function onClick(event) {
    if (isAnimating) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    // Find first intersection with a screen mesh
    const screenIntersect = intersects.find(intersect => 
        intersect.object.userData.isScreen
    );

    if (screenIntersect) {
        isAnimating = true;
        animationStartTime = performance.now();
        isZoomedIn = !isZoomedIn;
        
        if (isZoomedIn && bootupProgress === 0 && !isBooting) {
            isBooting = true;
            bootupSound.currentTime = 0;
            bootupSound.play();
        }
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    const screenIntersect = intersects.find(intersect => 
        intersect.object.userData.isScreen
    );

    if (screenIntersect) {
        selectedObject = screenIntersect.object;
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

function animateCamera(currentTime) {
    if (!isAnimating) return;

    const elapsed = currentTime - animationStartTime;
    const progress = Math.min(elapsed / zoomDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    if (isZoomedIn) {
        // Zooming in - store current orbital state
        lastOrbitalState.position.copy(camera.position);
        lastOrbitalState.rotationX = currentRotationX;
        lastOrbitalState.rotationY = currentRotationY;
        
        // Animate to zoomed position
        camera.position.lerpVectors(lastOrbitalState.position, cameraStates.zoomedIn.position, eased);
        const currentLookAt = new THREE.Vector3();
        currentLookAt.lerpVectors(new THREE.Vector3(0, 0, 0), cameraStates.zoomedIn.lookAt, eased);
        camera.lookAt(currentLookAt);
    } else {
        // Zooming out - restore orbital state
        const startPosition = cameraStates.zoomedIn.position.clone();
        const endPosition = new THREE.Vector3();
        
        // Calculate end position based on stored rotation
        endPosition.x = Math.sin(lastOrbitalState.rotationX) * orbitRadius;
        endPosition.z = Math.cos(lastOrbitalState.rotationX) * orbitRadius;
        endPosition.y = 2 + Math.sin(lastOrbitalState.rotationY) * 2;
        
        camera.position.lerpVectors(startPosition, endPosition, eased);
        camera.lookAt(0, 0, 0);
        
        // Restore rotation values
        if (progress >= 1) {
            currentRotationX = lastOrbitalState.rotationX;
            currentRotationY = lastOrbitalState.rotationY;
            targetRotationX = lastOrbitalState.rotationX;
            targetRotationY = lastOrbitalState.rotationY;
        }
    }

    if (progress >= 1) {
        isAnimating = false;
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
    if (event.button === 0 && !isZoomedIn) { // Left click only
        isDragging = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('mousemove', (event) => {
    if (isDragging && !isZoomedIn) {
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

// Modify the animation loop
function animate(currentTime) {
    requestAnimationFrame(animate);
    
    if (!isAnimating && !isZoomedIn) {
        // Smooth camera movement
        currentRotationX += (targetRotationX - currentRotationX) * orbitSpeed;
        currentRotationY += (targetRotationY - currentRotationY) * orbitSpeed;

        // Calculate camera position on a sphere
        camera.position.x = Math.sin(currentRotationX) * orbitRadius;
        camera.position.z = Math.cos(currentRotationX) * orbitRadius;
        camera.position.y = 2 + Math.sin(currentRotationY) * 2;

        // Add minimum distance check
        const minDistance = 1.5; // Minimum distance from center
        const currentDistance = Math.sqrt(
            camera.position.x * camera.position.x +
            camera.position.y * camera.position.y +
            camera.position.z * camera.position.z
        );

        if (currentDistance < minDistance) {
            const scale = minDistance / currentDistance;
            camera.position.multiplyScalar(scale);
        }

        // Always look at the center
        camera.lookAt(0, 0, 0);
    }

    animateCamera(currentTime);
    
    // Update bootup animation
    if (isBooting && bootupProgress < 1) {
        const progress = (bootupSound.currentTime / bootupSound.duration) * 1.2;
        bootupProgress = Math.min(progress, 1);
        
        if (bootupProgress >= 1) {
            bootupProgress = 1;
            isBooting = false;
        }
        updateBootScreen();
    }
    
    composer.render();
}

animate();

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

// Handle keyboard input for terminal
window.addEventListener('keydown', (event) => {
    if (showTerminal) {
        if (event.key === 'Enter') {
            handleCommand(currentCommand);
            currentCommand = '';
            // Play enter key with lower pitch and higher volume
            const sound = new Audio('sounds/old keyboard.mp3');
            sound.preservesPitch = false;
            sound.playbackRate = 0.8;
            sound.volume = 1.0; // Maximum volume
            sound.play();
        } else if (event.key === 'Backspace') {
            currentCommand = currentCommand.slice(0, -1);
            // Play backspace with slightly different pitch
            const sound = new Audio('sounds/old keyboard.mp3');
            sound.preservesPitch = false;
            sound.playbackRate = 0.85;
            sound.volume = 1.0; // Maximum volume
            sound.play();
        } else if (event.key.length === 1) {
            currentCommand += event.key;
            playRandomTypeSound();
        }
        updateBootScreen();
    }
});

function handleCommand(cmd) {
    switch(cmd) {
        case 'help':
            currentPage = 'help';
            break;
        case 'home':
            currentPage = 'home';
            break;
        case 'clear':
            terminalHistory.length = 0;
            break;
        case 'about':
            currentPage = 'about';
            break;
        case 'projects':
            currentPage = 'projects';
            break;
        case 'contact':
            currentPage = 'contact';
            break;
        default:
            if (cmd) {
                terminalHistory.push(`Unknown command: ${cmd}`);
            }
    }
}

// Add cursor blink
setInterval(() => {
    if (showTerminal) {
        cursorVisible = !cursorVisible;
        updateBootScreen();
    }
}, 500);
