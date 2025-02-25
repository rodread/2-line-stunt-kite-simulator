/**
 * Kite Flying Simulator - Main Application Entry Point
 * 
 * This file serves as the primary entry point for the application.
 * It initializes the application, sets up event listeners,
 * and orchestrates the main components.
 */

import { initWorld, updateWorld, getScene, getCamera, getRenderer } from './world.js';
import { loadKiteModel, updateKitePosition } from './kite.js';
import { initPhysics, updatePhysics } from './physics/engine.js';
import { initWindSystem, updateWind, setWindSpeed } from './physics/wind.js';
import { initTethers, updateTethers } from './physics/tether.js';
import { initControls, pollControls } from './controls.js';
import { initTelemetry, updateTelemetry } from './telemetry.js';
import { FPSCounter } from './utils.js';

// Global state
let isInitialized = false;
let isLoading = true;
let lastTime = 0;
const fpsCounter = new FPSCounter();

/**
 * Initialize the application
 */
async function init() {
    // Initialize UI event listeners
    initUIEvents();
    
    try {
        // Initialize the world first (handles THREE.js setup)
        await initWorld();
        updateLoadingProgress(20, 'World initialized');
        
        // Initialize the kite model
        await loadKiteModel();
        updateLoadingProgress(40, 'Kite model loaded');
        
        // Initialize physics systems
        initPhysics();
        updateLoadingProgress(60, 'Physics initialized');
        
        initWindSystem();
        updateLoadingProgress(70, 'Wind system initialized');
        
        initTethers();
        updateLoadingProgress(80, 'Tethers initialized');
        
        // Initialize controls and telemetry
        initControls();
        updateLoadingProgress(90, 'Controls initialized');
        
        initTelemetry();
        updateLoadingProgress(100, 'Simulation ready');
        
        // Mark initialization as complete
        isInitialized = true;
        isLoading = false;
        
        // Hide loading screen with a slight delay to ensure a smooth transition
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 500);
        
        // Start animation loop
        requestAnimationFrame(animate);
    } catch (error) {
        console.error('Initialization error:', error);
        // Show error in the loading screen
        document.getElementById('loading-text').textContent = 'Error loading simulator: ' + error.message;
        document.getElementById('loading-text').style.color = 'red';
    }
}

/**
 * Update loading progress bar and text
 */
function updateLoadingProgress(percent, message) {
    const progressBar = document.getElementById('loading-progress');
    const loadingText = document.getElementById('loading-text');
    
    progressBar.style.width = `${percent}%`;
    loadingText.textContent = message;
}

/**
 * Main animation loop
 */
function animate(currentTime) {
    // Calculate delta time for smooth animations regardless of frame rate
    const deltaTime = (currentTime - lastTime) / 1000; // convert to seconds
    lastTime = currentTime;
    
    // Update FPS counter
    fpsCounter.update();
    document.getElementById('fps').textContent = fpsCounter.getFPS().toFixed(1);
    
    if (isInitialized) {
        // Poll for user input
        pollControls();
        
        // Update physics (simplified for now)
        updatePhysics(deltaTime);
        updateWind(deltaTime);
        updateTethers(deltaTime);
        
        // Update kite position based on physics
        updateKitePosition(deltaTime);
        
        // Update the world (THREE.js rendering)
        updateWorld(deltaTime);
        
        // Update telemetry display
        updateTelemetry();
    }
    
    // Continue animation loop
    requestAnimationFrame(animate);
}

/**
 * Initialize UI event listeners
 */
function initUIEvents() {
    // Wind speed slider
    const windControl = document.getElementById('wind-control');
    const windValue = document.getElementById('wind-control-value');
    
    windControl.addEventListener('input', function() {
        const value = this.value;
        windValue.textContent = `${value}%`;
        setWindSpeed(value / 100); // Normalize to 0-1
    });
    
    // Help button
    const helpButton = document.getElementById('help-button');
    const helpDialog = document.getElementById('help-dialog');
    const closeHelp = document.getElementById('close-help');
    
    helpButton.addEventListener('click', () => {
        helpDialog.classList.remove('hidden');
    });
    
    closeHelp.addEventListener('click', () => {
        helpDialog.classList.add('hidden');
    });
    
    // Close dialog when clicking outside
    helpDialog.addEventListener('click', (e) => {
        if (e.target === helpDialog) {
            helpDialog.classList.add('hidden');
        }
    });
    
    // TODO: Add event listeners for other controls (line lengths, kite selection)
}

// Start initialization when the page loads
window.addEventListener('load', init);

// Handle window resize
window.addEventListener('resize', () => {
    if (isInitialized) {
        const renderer = getRenderer();
        const camera = getCamera();
        
        // Update camera aspect ratio
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        // Update renderer size
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Export functions that might be needed by other modules
export { isInitialized, isLoading };
