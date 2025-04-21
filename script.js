// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "low-power"
});

// Create audio element for boot sound
const bootupSound = new Audio('sounds/computer bootup.mp3');

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
let isBooting = false; // Start as false, will be triggered by click

// Terminal state variables
let showTerminal = false;
let currentCommand = '';
let cursorVisible = true;
let currentPage = 'home';
const terminalHistory = [];

// Terminal content
const terminalPages = {
    home: `
Welcome to Brian's Terminal Portfolio
===================================
Type 'help' to see available commands.

`,
    help: `
Available Commands
================
help     - Show this help menu
home     - Return to home page
clear    - Clear terminal
about    - About me
projects - View my projects
contact  - Contact information

Type a command and press Enter.
`
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
        
        // Scale the table
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.0 / maxDim;
        table.scale.multiplyScalar(scale);

        // Mark table as non-interactive
        table.traverse((child) => {
            if (child.isMesh) {
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
                const computerScale = 2.5 / computerMaxDim;
                computer.scale.multiplyScalar(computerScale);

                // Position table below computer instead of moving computer
                const tableHeight = size.y * scale;
                table.position.y = computer.position.y - (tableHeight / 2) - (computerSize.y * computerScale / 2);

                // Apply materials settings to computer
                computer.traverse((child) => {
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

    // Find first non-table intersection
    const nonTableIntersect = intersects.find(intersect => 
        !intersect.object.userData.isTable
    );

    if (nonTableIntersect) {
        isAnimating = true;
        animationStartTime = performance.now();
        isZoomedIn = !isZoomedIn;
        
        if (isZoomedIn && !isBooting) {
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

    if (intersects.length > 0) {
        // Find first non-table intersection
        const nonTableIntersect = intersects.find(intersect => 
            !intersect.object.userData.isTable
        );

        if (nonTableIntersect) {
            const object = nonTableIntersect.object;
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
        // Calculate progress based on audio time, but complete slightly before audio ends
        const progress = (bootupSound.currentTime / bootupSound.duration) * 1.2; // Complete 20% faster than audio
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

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    outlinePass.resolution.set(window.innerWidth, window.innerHeight);
});

// Handle keyboard input for terminal
window.addEventListener('keydown', (event) => {
    if (showTerminal) {
        if (event.key === 'Enter') {
            handleCommand(currentCommand);
            currentCommand = '';
        } else if (event.key === 'Backspace') {
            currentCommand = currentCommand.slice(0, -1);
        } else if (event.key.length === 1) {
            currentCommand += event.key;
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
