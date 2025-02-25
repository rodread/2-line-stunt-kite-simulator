/**
 * Kite Flying Simulator - Physics Engine
 * 
 * This is the core physics engine that coordinates all physics calculations.
 * It handles:
 * - Force calculations and application
 * - Integration of physics equations
 * - Coordination between wind, kite, and tether physics
 */

import { getKiteProperties, applyForce } from '../kite.js';
import { getWindForce, getWindDirection } from './wind.js';
import { getTetherForces } from './tether.js';

// Physics constants
const GRAVITY = 9.81; // m/s²
const AIR_DENSITY = 1.225; // kg/m³ (at sea level)

// Physics engine configuration
let config = {
    timeScale: 1.0, // Simulation time scale (1.0 = real-time)
    simulationStepsPerFrame: 1, // Number of physics steps per frame
    enableGravity: true,
    enableWind: true,
    enableDrag: true,
    enableCollisions: true
};

// Physics state
let isRunning = false;
let accumulator = 0; // For fixed time step
const FIXED_TIME_STEP = 1/60; // 60 Hz physics update

/**
 * Initialize the physics engine
 */
function initPhysics() {
    console.log('Initializing physics engine...');
    
    // Set default configuration values
    
    // Mark physics as running
    isRunning = true;
    
    // TODO: Stage 2 - Add more sophisticated physics initialization
}

/**
 * Update physics for the current frame
 * @param {number} deltaTime - Time since last frame in seconds
 */
function updatePhysics(deltaTime) {
    if (!isRunning) return;
    
    // Scale deltaTime by time scale
    const scaledDeltaTime = deltaTime * config.timeScale;
    
    // Fixed time step approach (accumulates leftover time)
    accumulator += scaledDeltaTime;
    
    // Run physics steps
    while (accumulator >= FIXED_TIME_STEP) {
        stepPhysics(FIXED_TIME_STEP);
        accumulator -= FIXED_TIME_STEP;
    }
}

/**
 * Perform a single physics step
 * @param {number} dt - Fixed time step
 */
function stepPhysics(dt) {
    // Get current kite properties
    const kite = getKiteProperties();
    
    // Initialize total force
    const totalForce = { x: 0, y: 0, z: 0 };
    
    // Apply gravity if enabled
    if (config.enableGravity) {
        // Gravity acts in -Y direction
        totalForce.y -= kite.mass * GRAVITY;
    }
    
    // Apply wind forces if enabled
    if (config.enableWind) {
        const windForce = getWindForce(kite);
        totalForce.x += windForce.x;
        totalForce.y += windForce.y;
        totalForce.z += windForce.z;
    }
    
    // Apply tether forces
    const tetherForces = getTetherForces();
    totalForce.x += tetherForces.x;
    totalForce.y += tetherForces.y;
    totalForce.z += tetherForces.z;
    
    // Apply aerodynamic drag if enabled
    if (config.enableDrag) {
        const dragForce = calculateDragForce(kite);
        totalForce.x += dragForce.x;
        totalForce.y += dragForce.y;
        totalForce.z += dragForce.z;
    }
    
    // Apply the total force to the kite
    applyForce(totalForce);
    
    // TODO: Stage 2 - Add torque calculations and rotational physics
    
    // TODO: Stage 3 - Add collision detection with ground
    if (config.enableCollisions) {
        checkGroundCollision(kite);
    }
}

/**
 * Calculate aerodynamic drag force
 * @param {Object} kite - Kite properties
 * @returns {Object} The drag force vector {x, y, z}
 */
function calculateDragForce(kite) {
    // TODO: Stage 2 - Implement proper aerodynamic calculations
    
    // Simple drag implementation for now
    const windDirection = getWindDirection();
    const kiteVelocity = kite.velocity;
    
    // Calculate relative velocity (wind - kite)
    const relativeVelocity = {
        x: windDirection.x - kiteVelocity.x,
        y: windDirection.y - kiteVelocity.y,
        z: windDirection.z - kiteVelocity.z
    };
    
    // Calculate velocity magnitude squared
    const velocityMagSquared = 
        relativeVelocity.x * relativeVelocity.x + 
        relativeVelocity.y * relativeVelocity.y + 
        relativeVelocity.z * relativeVelocity.z;
    
    // Calculate drag magnitude
    // F_drag = 0.5 * rho * v^2 * Cd * A
    const dragMagnitude = 0.5 * AIR_DENSITY * velocityMagSquared * kite.dragCoefficient * kite.area;
    
    // Normalize the relative velocity
    const velocityMag = Math.sqrt(velocityMagSquared);
    
    // Avoid division by zero
    if (velocityMag < 0.0001) {
        return { x: 0, y: 0, z: 0 };
    }
    
    // Calculate drag force components (opposite to relative velocity)
    return {
        x: -dragMagnitude * relativeVelocity.x / velocityMag,
        y: -dragMagnitude * relativeVelocity.y / velocityMag,
        z: -dragMagnitude * relativeVelocity.z / velocityMag
    };
}

/**
 * Check and handle ground collision
 * @param {Object} kite - Kite properties
 */
function checkGroundCollision(kite) {
    // Simple ground collision check
    if (kite.position.y < 0.1) { // Small buffer above ground
        // Reset velocity with some damping
        kite.velocity.x *= 0.8;
        kite.velocity.y = 0;
        kite.velocity.z *= 0.8;
        
        // Ensure kite stays above ground
        kite.position.y = 0.1;
    }
}

/**
 * Update physics engine configuration
 * @param {Object} newConfig - New configuration values
 */
function updatePhysicsConfig(newConfig) {
    // Update only the provided config values
    Object.assign(config, newConfig);
}

/**
 * Pause/resume the physics simulation
 * @param {boolean} shouldRun - Whether the simulation should run
 */
function setPhysicsRunning(shouldRun) {
    isRunning = shouldRun;
}

/**
 * Get current physics configuration
 * @returns {Object} Current physics configuration
 */
function getPhysicsConfig() {
    return { ...config }; // Return a copy to prevent direct modification
}

// Export public functions
export {
    initPhysics,
    updatePhysics,
    updatePhysicsConfig,
    setPhysicsRunning,
    getPhysicsConfig
};
