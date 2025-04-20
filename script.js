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

// Add orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 2;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2;
controls.enabled = false; // Start with controls disabled

// Add stronger ambient lighting for even illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// Add multiple point lights for better coverage
const frontLight = new THREE.PointLight(0xffffff, 0.5);
frontLight.position.set(0, 0, 5);
scene.add(frontLight);

const backLight = new THREE.PointLight(0xffffff, 0.5);
backLight.position.set(0, 0, -5);
scene.add(backLight);

const topLight = new THREE.PointLight(0xffffff, 0.5);
topLight.position.set(0, 5, 0);
scene.add(topLight);

// Set initial camera position
camera.position.set(2, 2, 4);
camera.lookAt(0, 0, 0);

// Store initial camera state
const initialCameraPosition = camera.position.clone();
const initialCameraLookAt = new THREE.Vector3(0, 0, 0);

// Variables for camera animation
let isAnimating = false;
let originalCameraPosition = null;
let currentLookAtTarget = initialCameraLookAt.clone();
// Adjusted target position to better align with screen
const targetCameraPosition = new THREE.Vector3(0, 0.3, 1.2);
const targetCameraLookAt = new THREE.Vector3(0, 0.3, 0);
const zoomDuration = 1500; // Faster transition to reduce drift
let animationStartTime = 0;
let isZoomedIn = false;

// Initialize camera state
let lastCameraPosition = camera.position.clone();
let lastLookAtTarget = initialCameraLookAt.clone();

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

        // Apply materials settings for better retro look
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.metalness = 0.3;
                child.material.roughness = 0.7;
                // Tag monitor screen meshes to ignore for glow
                if (child.name.toLowerCase().includes('screen') || 
                    child.material.name.toLowerCase().includes('screen')) {
                    child.userData.isScreen = true;
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
        controls.enabled = false;

        // Store exact current position and target
        if (!isZoomedIn) {
            // Zoom in
            originalCameraPosition = camera.position.clone();
            currentLookAtTarget = new THREE.Vector3(0, 0, 0);
        } else {
            // Zoom out
            originalCameraPosition = camera.position.clone();
            currentLookAtTarget = targetCameraLookAt.clone();
            const temp = targetCameraPosition.clone();
            targetCameraPosition.copy(initialCameraPosition);
            setTimeout(() => {
                targetCameraPosition.copy(temp);
            }, zoomDuration);
        }
        isZoomedIn = !isZoomedIn;
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        // Only show glow on non-screen parts
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
    if (!isAnimating) {
        return;
    }

    const elapsed = currentTime - animationStartTime;
    const progress = Math.min(elapsed / zoomDuration, 1);
    
    // More precise easing function
    const eased = 1 - Math.pow(1 - progress, 4); // Adjusted power for smoother end

    if (progress < 1) {
        // Precise position transition
        camera.position.lerpVectors(
            originalCameraPosition,
            targetCameraPosition,
            eased
        );

        // Direct lookAt transition
        if (isZoomedIn) {
            camera.lookAt(targetCameraLookAt);
        } else {
            const currentLookAt = new THREE.Vector3();
            currentLookAt.lerpVectors(
                currentLookAtTarget,
                initialCameraLookAt,
                eased
            );
            camera.lookAt(currentLookAt);
        }
    } else {
        isAnimating = false;
        if (!isZoomedIn) {
            controls.enabled = true;
            camera.position.copy(initialCameraPosition);
            camera.lookAt(initialCameraLookAt);
        } else {
            camera.position.copy(targetCameraPosition);
            camera.lookAt(targetCameraLookAt);
        }
    }
}

// Animation loop
function animate(currentTime) {
    requestAnimationFrame(animate);
    
    if (!isAnimating) {
        controls.update();
    }
    
    animateCamera(currentTime);
    composer.render();
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    
    // Update outline pass
    outlinePass.resolution.set(window.innerWidth, window.innerHeight);
});
