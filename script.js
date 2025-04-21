// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "low-power"
});

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
outlinePass.edgeGlow = 1;
outlinePass.edgeThickness = 2;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0xffffff);
composer.addPass(outlinePass);

// Add lighting with reduced intensity
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const frontLight = new THREE.PointLight(0xffffff, 0.3);
frontLight.position.set(2, 2, 5);
scene.add(frontLight);

const backLight = new THREE.PointLight(0xffffff, 0.3);
backLight.position.set(-2, 2, -5);
scene.add(backLight);

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
let isBooting = false;
let currentCommand = '';
let terminalHistory = [];
let currentDirectory = '~';
const commands = {
    'help': 'Show available commands',
    'home': 'Display home information',
    'clear': 'Clear terminal screen'
};

function drawTerminal() {
    screenCtx.fillStyle = 'black';
    screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
    
    const lineHeight = 20;
    let currentY = 30;
    
    // Draw terminal history
    screenCtx.fillStyle = '#ffffff';
    screenCtx.font = '16px "Courier New", monospace';
    
    terminalHistory.forEach(line => {
        screenCtx.fillText(line, 20, currentY);
        currentY += lineHeight;
    });
    
    // Draw current input line
    screenCtx.fillText(`${currentDirectory} > ${currentCommand}_`, 20, currentY);
    
    screenTexture.needsUpdate = true;
}

function executeCommand(cmd) {
    const command = cmd.toLowerCase().trim();
    
    switch(command) {
        case 'help':
            terminalHistory.push(`${currentDirectory} > ${cmd}`);
            terminalHistory.push('Available commands:');
            Object.entries(commands).forEach(([cmd, desc]) => {
                terminalHistory.push(`  ${cmd.padEnd(10)} - ${desc}`);
            });
            break;
            
        case 'home':
            terminalHistory.push(`${currentDirectory} > ${cmd}`);
            terminalHistory.push('Welcome to my Portfolio Terminal');
            terminalHistory.push('------------------------');
            terminalHistory.push('Name: [Your Name]');
            terminalHistory.push('Role: Full Stack Developer');
            terminalHistory.push('Type "help" to see available commands');
            break;
            
        case 'clear':
            terminalHistory = [];
            break;
            
        case '':
            terminalHistory.push(`${currentDirectory} >`);
            break;
            
        default:
            terminalHistory.push(`${currentDirectory} > ${cmd}`);
            terminalHistory.push(`Command not found: ${cmd}`);
    }
    
    currentCommand = '';
    drawTerminal();
}

function updateBootScreen() {
    screenCtx.fillStyle = 'black';
    screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
    
    if (bootupProgress >= 1) {
        // Switch to terminal mode
        drawTerminal();
        return;
    }
    
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
        position: new THREE.Vector3(0.11, 0.7, 1.4),
        lookAt: new THREE.Vector3(0.11, 0.6, 0)
    }
};

// Animation settings
const zoomDuration = 1000;

// Raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

// Load the GLTF model
const loader = new THREE.GLTFLoader();
loader.load(
    'scene.gltf',
    function (gltf) {
        const model = gltf.scene;
        scene.add(model);
        
        // Center and rotate the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.rotation.y = Math.PI / 2;
        
        // Scale the model
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        model.scale.multiplyScalar(scale);

        // Apply materials settings
        model.traverse((child) => {
            if (child.isMesh) {
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
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error occurred while loading the model:', error);
    }
);

function onClick(event) {
    if (isAnimating) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        isAnimating = true;
        animationStartTime = performance.now();
        isZoomedIn = !isZoomedIn;
        
        // Only start boot animation if it hasn't started yet
        if (isZoomedIn && bootupProgress === 0) {
            isBooting = true;
        }
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (!object.userData.isScreen) {
            selectedObject = object;
            outlinePass.selectedObjects = [selectedObject];
        } else {
            selectedObject = null;
            outlinePass.selectedObjects = [];
        }
    } else {
        selectedObject = null;
        outlinePass.selectedObjects = [];
    }
}

function animateCamera(currentTime) {
    if (!isAnimating) return;

    const elapsed = currentTime - animationStartTime;
    const progress = Math.min(elapsed / zoomDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    const startState = isZoomedIn ? cameraStates.default : cameraStates.zoomedIn;
    const endState = isZoomedIn ? cameraStates.zoomedIn : cameraStates.default;

    if (progress < 1) {
        camera.position.lerpVectors(startState.position, endState.position, eased);
        const currentLookAt = new THREE.Vector3();
        currentLookAt.lerpVectors(startState.lookAt, endState.lookAt, eased);
        camera.lookAt(currentLookAt);
    } else {
        camera.position.copy(endState.position);
        camera.lookAt(endState.lookAt);
        isAnimating = false;
    }
}

// Animation loop
function animate(currentTime) {
    requestAnimationFrame(animate);
    animateCamera(currentTime);
    
    // Update bootup animation
    if (isBooting && bootupProgress < 1) {
        bootupProgress += 0.01; // Slower progress
        if (bootupProgress >= 1) {
            bootupProgress = 1;
            // Don't reset isBooting, let it stay visible
        }
        updateBootScreen();
    }
    
    composer.render();
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    outlinePass.resolution.set(window.innerWidth, window.innerHeight);
});

// Add keyboard event listener for terminal input
window.addEventListener('keydown', (event) => {
    if (bootupProgress < 1) return; // Only handle input after loading is complete
    
    if (event.key === 'Enter') {
        executeCommand(currentCommand);
    } else if (event.key === 'Backspace') {
        currentCommand = currentCommand.slice(0, -1);
        drawTerminal();
    } else if (event.key.length === 1) {
        currentCommand += event.key;
        drawTerminal();
    }
});
