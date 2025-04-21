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
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 1;
outlinePass.edgeThickness = 2;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0xffffff);
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
const lamp1 = createPendantLamp(new THREE.Vector3(0, 3, 0));
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
