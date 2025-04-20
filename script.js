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
outlinePass.visibleEdgeColor.set(0x00ff00);
outlinePass.hiddenEdgeColor.set(0x00ff00);
composer.addPass(outlinePass);

// Add orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 2;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2;

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

// Position camera to match reference image angle
camera.position.set(2, 2, 4);
camera.lookAt(0, 0, 0);

// Variables for camera animation
let isAnimating = false;
let originalCameraPosition = null;
let originalCameraRotation = null;
const targetCameraPosition = new THREE.Vector3(0, 0.7, 2);
const zoomDuration = 2500;
let animationStartTime = 0;

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
        if (!originalCameraPosition) {
            originalCameraPosition = camera.position.clone();
            originalCameraRotation = camera.rotation.clone();
            isAnimating = true;
            animationStartTime = performance.now();
            controls.enabled = false;
        } else {
            isAnimating = true;
            animationStartTime = performance.now();
            [originalCameraPosition, targetCameraPosition] = [camera.position.clone(), originalCameraPosition];
        }
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
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
    
    // Enhanced smooth easing function
    const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    if (progress < 1) {
        // Smooth position transition
        camera.position.lerpVectors(
            originalCameraPosition,
            targetCameraPosition,
            eased
        );

        // Update camera look-at
        const targetLookAt = new THREE.Vector3(0, 0, 0);
        const currentLookAt = new THREE.Vector3();
        currentLookAt.lerpVectors(
            originalCameraPosition.clone().add(new THREE.Vector3(0, 0, -1)),
            targetLookAt,
            eased
        );
        camera.lookAt(currentLookAt);
    } else {
        isAnimating = false;
        controls.enabled = true;
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
