/**
 * Kite Flying Simulator - World Environment Module
 * 
 * This module handles the 3D world setup, including:
 * - Scene initialization
 * - Camera setup
 * - Lighting
 * - Ground/sky setup
 * - Renderer configuration
 */

// Module-level variables
let scene, camera, renderer, controls;
let ground, sky;

/**
 * Initialize the 3D world
 * @returns {Promise} Resolves when world is initialized
 */
function initWorld() {
    return new Promise((resolve, reject) => {
        try {
            // Create the scene
            scene = new THREE.Scene();
            
            // Create and configure the camera
            camera = new THREE.PerspectiveCamera(
                75, // Field of view
                window.innerWidth / window.innerHeight, // Aspect ratio
                0.1, // Near plane
                1000 // Far plane
            );
            
            // Set initial camera position (behind the kite operator looking towards the kite)
            camera.position.set(0, 2, -5); // x, y, z (y is height, -z is behind)
            camera.lookAt(0, 2, 5); // Look at the position where the kite will be
            
            // Create the renderer
            const canvas = document.getElementById('kiteCanvas');
            renderer = new THREE.WebGLRenderer({ 
                canvas: canvas,
                antialias: true  // Enable antialiasing for smoother edges
            });
            
            // Configure renderer
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setClearColor(0x87CEEB); // Sky blue background
            
            // Set up orbit controls for camera manipulation
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.target.set(0, 2, 0); // Set the orbit point to center of scene
            controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below ground
            controls.minDistance = 3; // Minimum zoom distance
            controls.maxDistance = 20; // Maximum zoom distance
            controls.update();
            
            // Create the ground plane
            createGround();
            
            // Setup basic lighting
            setupLighting();
            
            // Add subtle fog for depth perception
            scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);
            
            // TODO: Stage 1 - Add skybox or other environmental elements
            
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Create the ground plane
 */
function createGround() {
    // Create a large ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
    
    // Create material with a grass texture
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x7CFC00, // Light green
        roughness: 0.8,
        metalness: 0.2
    });
    
    // Create the mesh
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    
    // Rotate to be horizontal (x-z plane, y up)
    ground.rotation.x = -Math.PI / 2;
    
    // Add the ground to the scene
    scene.add(ground);
    
    // TODO: Stage 3 - Add terrain features or texture
}

/**
 * Set up scene lighting
 */
function setupLighting() {
    // Add ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Add directional light to simulate sun
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true; // Enable shadow casting
    
    // Configure shadow properties
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    const d = 50;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    
    scene.add(sunLight);
    
    // TODO: Stage 3 - Add more sophisticated lighting for time of day
}

/**
 * Update the world (called each frame)
 * @param {number} deltaTime - Time since last frame in seconds
 */
function updateWorld(deltaTime) {
    // Update the controls
    controls.update();
    
    // Render the scene
    renderer.render(scene, camera);
    
    // TODO: Stage 3 - Add dynamic world elements (clouds, etc.)
}

// Getters for main objects
function getScene() { return scene; }
function getCamera() { return camera; }
function getRenderer() { return renderer; }
function getControls() { return controls; }

// Export public functions and objects
export { 
    initWorld, 
    updateWorld, 
    getScene, 
    getCamera, 
    getRenderer, 
    getControls 
};
