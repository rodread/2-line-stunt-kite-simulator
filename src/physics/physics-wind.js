/**
 * Kite Flying Simulator - Wind System
 * 
 * This module handles wind simulation, including:
 * - Wind direction and speed
 * - Wind gusts and variations
 * - Wind force calculations
 * - Visual representation of wind (particle effects)
 */

import { getScene } from '../world.js';

// Wind state
let windState = {
    // Base wind parameters
    baseSpeed: 5.0, // m/s (approx. 11 mph)
    baseDirection: { x: 0, y: 0, z: 1 }, // Moving in +Z direction
    
    // Current wind parameters (after adding variation)
    currentSpeed: 5.0,
    currentDirection: { x: 0, y: 0, z: 1 },
    
    // Wind variation parameters
    gustStrength: 0.2, // Max gust strength as percentage of base speed
    gustFrequency: 0.2, // Frequency of gusts (0-1)
    turbulence: 0.1, // Amount of random variation (0-1)
    
    // User control
    userWindScale: 1.0, // User-controlled wind speed multiplier (0-1)
};

// Wind visualization
let particleSystem = null;
let windArrow = null;

/**
 * Initialize the wind system
 */
function initWindSystem() {
    console.log('Initializing wind system...');
    
    // Initialize wind direction
    setWindDirection(0, 0, 1); // +Z is downwind
    
    // Initialize wind visualization if needed
    initWindVisualization();
    
    // TODO: Stage 3 - Add more sophisticated wind model
}

/**
 * Initialize wind visualization (particles and indicators)
 */
function initWindVisualization() {
    const scene = getScene();
    
    // TODO: Stage 3 - Implement wind particle system
    
    // Create a simple arrow to show wind direction
    createWindDirectionArrow(scene);
}

/**
 * Create a wind direction arrow
 * @param {THREE.Scene} scene - The Three.js scene
 */
function createWindDirectionArrow(scene) {
    // Create a simple arrow to indicate wind direction
    const arrowLength = 2;
    const headLength = 0.4;
    const headWidth = 0.2;
    
    // Create arrow pointing in wind direction (Z-axis for now)
    const direction = new THREE.Vector3(
        windState.baseDirection.x,
        windState.baseDirection.y,
        windState.baseDirection.z
    ).normalize();
    
    const origin = new THREE.Vector3(0, 0.1, -5); // Just above ground, behind starting position
    
    // Create arrow helper
    windArrow = new THREE.ArrowHelper(
        direction,
        origin,
        arrowLength,
        0x3333FF, // Blue color
        headLength,
        headWidth
    );
    
    scene.add(windArrow);
}

/**
 * Update wind system
 * @param {number} deltaTime - Time since last frame in seconds
 */
function updateWind(deltaTime) {
    // Update wind variation over time
    updateWindVariation(deltaTime);
    
    // Update the wind visualization
    updateWindVisualization();
    
    // TODO: Stage 3 - Add more dynamic wind behavior
}

/**
 * Update wind variation over time
 * @param {number} deltaTime - Time since last frame in seconds
 */
function updateWindVariation(deltaTime) {
    // Simple sine-based gust model + small random variation
    const time = performance.now() / 1000; // Current time in seconds
    
    // Calculate gust effect using sine wave
    const gustFactor = Math.sin(time * windState.gustFrequency) * windState.gustStrength;
    
    // Add some random turbulence
    const turbulenceFactor = (Math.random() - 0.5) * windState.turbulence;
    
    // Combine factors, ensuring wind doesn't go negative
    const variationFactor = 1.0 + gustFactor + turbulenceFactor;
    
    // Apply variation to current wind speed, scaled by user setting
    windState.currentSpeed = Math.max(0.1, windState.baseSpeed * variationFactor * windState.userWindScale);
    
    // Also add small variations to wind direction
    const directionVariation = windState.turbulence * 0.1;
    windState.currentDirection = {
        x: windState.baseDirection.x + (Math.random() - 0.5) * directionVariation,
        y: windState.baseDirection.y + (Math.random() - 0.5) * directionVariation,
        z: windState.baseDirection.z + (Math.random() - 0.5) * directionVariation
    };
    
    // Normalize direction vector
    const mag = Math.sqrt(
        windState.currentDirection.x * windState.currentDirection.x +
        windState.currentDirection.y * windState.currentDirection.y +
        windState.currentDirection.z * windState.currentDirection.z
    );
    
    windState.currentDirection.x /= mag;
    windState.currentDirection.y /= mag;
    windState.currentDirection.z /= mag;
}

/**
 * Update wind visualization
 */
function updateWindVisualization() {
    // Update wind arrow
    if (windArrow) {
        // Update arrow direction to match current wind
        const direction = new THREE.Vector3(
            windState.currentDirection.x,
            windState.currentDirection.y,
            windState.currentDirection.z
        );
        
        windArrow.setDirection(direction);
        
        // Scale arrow length by wind speed
        const arrowLength = 2 * (windState.currentSpeed / windState.baseSpeed);
        windArrow.setLength(arrowLength, 0.4, 0.2);
    }
    
    // TODO: Stage 3 - Update particle system if implemented
}

/**
 * Calculate wind force on the kite
 * @param {Object} kite - Kite properties
 * @returns {Object} Wind force vector {x, y, z}
 */
function getWindForce(kite) {
    // TODO: Stage 2 - Implement more accurate aerodynamic model
    
    // Basic wind force model
    // F = 0.5 * rho * v^2 * A
    // Using kite area and current wind speed
    
    // Simple approach for now - force proportional to wind speed squared
    const forceMagnitude = 0.5 * 1.225 * windState.currentSpeed * windState.currentSpeed * kite.area;
    
    return {
        x: forceMagnitude * windState.currentDirection.x,
        y: forceMagnitude * windState.currentDirection.y,
        z: forceMagnitude * windState.currentDirection.z
    };
}

/**
 * Set wind speed scale (used by UI controls)
 * @param {number} scale - Wind speed scale (0-1)
 */
function setWindSpeed(scale) {
    // Clamp scale to valid range
    const clampedScale = Math.max(0, Math.min(1, scale));
    windState.userWindScale = clampedScale;
}

/**
 * Set base wind direction
 * @param {number} x - X component of direction
 * @param {number} y - Y component of direction
 * @param {number} z - Z component of direction
 */
function setWindDirection(x, y, z) {
    // Set direction vector
    windState.baseDirection = { x, y, z };
    
    // Normalize the vector
    const mag = Math.sqrt(x*x + y*y + z*z);
    if (mag > 0) {
        windState.baseDirection.x /= mag;
        windState.baseDirection.y /= mag;
        windState.baseDirection.z /= mag;
    }
    
    // Update current direction
    windState.currentDirection = { ...windState.baseDirection };
}

/**
 * Set wind variation parameters
 * @param {Object} params - Wind variation parameters
 */
function setWindVariation(params) {
    if (params.gustStrength !== undefined) {
        windState.gustStrength = params.gustStrength;
    }
    
    if (params.gustFrequency !== undefined) {
        windState.gustFrequency = params.gustFrequency;
    }
    
    if (params.turbulence !== undefined) {
        windState.turbulence = params.turbulence;
    }
}

/**
 * Get current wind speed
 * @returns {number} Wind speed in m/s
 */
function getWindSpeed() {
    return windState.currentSpeed;
}

/**
 * Get current wind direction
 * @returns {Object} Wind direction vector {x, y, z}
 */
function getWindDirection() {
    return { ...windState.currentDirection };
}

/**
 * Get current wind state
 * @returns {Object} Complete wind state object
 */
function getWindState() {
    return { ...windState }; // Return a copy to prevent direct modification
}

// Export public functions
export {
    initWindSystem,
    updateWind,
    getWindForce,
    getWindSpeed,
    getWindDirection,
    getWindState,
    setWindSpeed,
    setWindDirection,
    setWindVariation
};
