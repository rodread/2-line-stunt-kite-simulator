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

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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
            
            // Set initial camera position (behind and above the kite operator looking towards the kite)
            camera.position.set(0, 8, -10); // Higher and further back for better visibility
            camera.lookAt(0, 5, -35); // Look at the position where the kite will be (in front of pilot)
            
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
            controls = new OrbitControls(camera, renderer.domElement);
            controls.target.set(0, 5, -35); // Set the orbit point to where the kite will be (in front of pilot)
            controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below ground
            controls.minDistance = 3; // Minimum zoom distance
            controls.maxDistance = 100; // Maximum zoom distance - increased to allow zooming out further
            controls.update();
            
            // Create the ground plane
            createGround();
            
            // Setup basic lighting
            setupLighting();
            
            // Remove fog completely as it was obscuring the kite
            // scene.fog = new THREE.FogExp2(0x87CEEB, 0.001);
            
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
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
    
    // Create a repeating grass texture
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = new THREE.CanvasTexture(createGrassTexture());
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(20, 20);
    
    // Create material with the grass texture
    const groundMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 0.8,
        metalness: 0.1
    });
    
    // Create the mesh
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    
    // Rotate to be horizontal (x-z plane, y up)
    ground.rotation.x = -Math.PI / 2;
    
    // Add the ground to the scene
    scene.add(ground);
    
    // Add grid lines for better spatial awareness
    const gridHelper = new THREE.GridHelper(100, 20, 0x000000, 0x444444);
    gridHelper.position.y = 0.01; // Slightly above ground to prevent z-fighting
    scene.add(gridHelper);
    
    // Add wind window visualization
    createWindWindow();
}

/**
 * Create a procedural grass texture
 * @returns {HTMLCanvasElement} Canvas with grass texture
 */
function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Fill background with base green
    context.fillStyle = '#7CFC00';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some variation
    for (let i = 0; i < 1000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 1 + Math.random() * 2;
        
        // Random darker green patches
        context.fillStyle = `rgba(0, ${100 + Math.random() * 100}, 0, 0.1)`;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }
    
    return canvas;
}

/**
 * Create a visualization of the kite's wind window
 */
function createWindWindow() {
    // Create a quarter-sphere to represent the wind window
    const radius = 30; // Match this to the tether length
    const segments = 16;
    
    // Create the geometry for the quarter-sphere
    const geometry = new THREE.SphereGeometry(
        radius, 
        segments, 
        segments, 
        0, // phiStart
        Math.PI, // phiLength (half a sphere)
        0, // thetaStart
        Math.PI / 2 // thetaLength (quarter of a sphere)
    );
    
    // Create a wireframe material with reduced opacity
    const material = new THREE.MeshBasicMaterial({
        color: 0x4682B4, // Steel blue
        wireframe: true,
        transparent: true,
        opacity: 0.15 // Reduced opacity to make it less obtrusive
    });
    
    // Create the mesh
    const windWindow = new THREE.Mesh(geometry, material);
    
    // Position it at the operator position, but rotate it to face forward (negative z)
    windWindow.position.set(0, 0, -10);
    windWindow.rotation.y = Math.PI; // Rotate 180 degrees to face forward
    
    // Add to scene
    scene.add(windWindow);
    
    // Add labels for wind window zones
    addWindWindowLabels(radius);
}

/**
 * Add rainbow-like power zone visualization to the wind window
 * @param {number} radius - The radius of the wind window
 */
function addWindWindowLabels(radius) {
    // Create a canvas for the texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Clear canvas
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create a rainbow-like gradient to indicate power zones
    // Red at the bottom (most power), through orange, yellow, green, to blue at the top (edge/least power)
    const gradient = context.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');      // Red (bottom - max power)
    gradient.addColorStop(0.25, 'rgba(255, 165, 0, 0.3)'); // Orange
    gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.3)');  // Yellow (middle - neutral)
    gradient.addColorStop(0.75, 'rgba(0, 255, 0, 0.3)');   // Green
    gradient.addColorStop(1, 'rgba(0, 0, 255, 0.3)');      // Blue (top - edge/min power)
    
    // Fill the canvas with the gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add small text labels
    context.font = 'bold 16px Arial'; // Small font size
    context.fillStyle = 'rgba(255, 255, 255, 0.7)'; // White with some opacity
    context.textAlign = 'center';
    context.fillText('Edge Zone', canvas.width / 2, 30); // Top
    context.fillText('Neutral Zone', canvas.width / 2, canvas.height / 2); // Middle
    context.fillText('Power Zone', canvas.width / 2, canvas.height - 20); // Bottom
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    
    // Create a plane to display the texture that covers the wind window
    const geometry = new THREE.PlaneGeometry(radius * 1.5, radius * 0.75);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.4, // Very transparent
        side: THREE.DoubleSide,
        depthWrite: false // Prevents z-fighting and ensures visibility
    });
    
    const label = new THREE.Mesh(geometry, material);
    // Position in front of the wind window (centered)
    label.position.set(0, radius / 2, -10 - radius / 2);
    label.rotation.x = -Math.PI / 4; // Angle to match the wind window
    label.rotation.y = Math.PI; // Rotate to face forward
    
    scene.add(label);
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
