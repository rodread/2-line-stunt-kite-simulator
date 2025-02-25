/**
 * Kite Flying Simulator - Physics Engine
 * 
 * This is the core physics engine that coordinates all physics calculations.
 * It handles:
 * - Force calculations and application
 * - Integration of physics equations
 * - Coordination between wind, kite, and tether physics
 */

import { getKiteProperties, applyForce, applyTorque } from '../kite.js';
import { getWindForce, getWindDirection, getWindSpeed } from './wind.js';
import { getTetherForces, getTetherConfig } from './tether.js';

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
    
    // Apply gravity if enabled (full strength for realistic physics)
    if (config.enableGravity) {
        // Gravity acts in -Y direction
        totalForce.y -= kite.mass * GRAVITY;
    }
    
    // Apply wind forces if enabled
    if (config.enableWind) {
        // Calculate aerodynamic forces (lift and drag)
        const aeroForces = calculateAerodynamicForces(kite);
        
        // Add lift and drag to total force
        totalForce.x += aeroForces.lift.x + aeroForces.drag.x;
        totalForce.y += aeroForces.lift.y + aeroForces.drag.y;
        totalForce.z += aeroForces.lift.z + aeroForces.drag.z;
    }
    
    // Apply tether forces - these constrain the kite's movement
    const tetherForces = getTetherForces();
    totalForce.x += tetherForces.x;
    totalForce.y += tetherForces.y;
    totalForce.z += tetherForces.z;
    
    // Add a small stabilizing force to keep the kite within view
    const stabilizingForce = calculateStabilizingForce(kite);
    totalForce.x += stabilizingForce.x;
    totalForce.y += stabilizingForce.y;
    totalForce.z += stabilizingForce.z;
    
    // Apply the total force to the kite using improved RK4 integration
    // We'll use a simplified version by just scaling the force by dt before applying
    const scaledForce = {
        x: totalForce.x * dt,
        y: totalForce.y * dt,
        z: totalForce.z * dt
    };
    
    applyForce(scaledForce);
    
    // Calculate and apply torque for rotational physics
    calculateAndApplyTorque(kite, tetherForces);
    
    // Check for collisions with ground
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
    const groundBuffer = 0.5; // Increased buffer above ground for better visibility
    
    // Check if kite is below or approaching the ground
    if (kite.position.y < groundBuffer) {
        // Apply a strong upward force to prevent going through the ground
        // This simulates the ground pushing back on the kite
        const groundRepulsionForce = {
            x: 0,
            y: kite.mass * GRAVITY * 2.0, // Strong enough to counteract gravity and then some
            z: 0
        };
        
        // Apply the force directly
        applyForce(groundRepulsionForce);
        
        // Reset velocity with damping (simulates friction with ground)
        kite.velocity.x *= 0.7; // More damping for better stability
        kite.velocity.y = Math.max(0, kite.velocity.y); // Only allow upward velocity
        kite.velocity.z *= 0.7;
        
        // Ensure kite stays above ground
        kite.position.y = groundBuffer;
        
        // Apply a stabilizing torque to prevent the kite from flipping over
        // This helps maintain a realistic orientation when near the ground
        const stabilizingTorque = {
            x: -kite.rotation.x * 0.5, // Try to level out the kite
            y: 0,
            z: -kite.rotation.z * 0.5
        };
        
        applyTorque(stabilizingTorque);
    }
}

/**
 * Improved Physics Integration Method
 * 
 * Update physics for the current frame
 * @param {number} deltaTime - Time since last frame in seconds
 */
function updatePhysics(deltaTime) {
    if (!isRunning) return;
    
    // Limit deltaTime to prevent large jumps during lag spikes
    const maxDeltaTime = 0.1; // Maximum allowed deltaTime (100ms)
    const clampedDeltaTime = Math.min(deltaTime, maxDeltaTime);
    
    // Scale deltaTime by time scale
    const scaledDeltaTime = clampedDeltaTime * config.timeScale;
    
    // Fixed time step approach (accumulates leftover time)
    accumulator += scaledDeltaTime;
    
    // Use smaller time steps for better stability
    const FIXED_TIME_STEP = 1/120; // 120 Hz physics update (smaller step)
    
    // Run physics steps
    let steps = 0;
    const maxSteps = 10; // Prevent spiral of death if accumulator gets too large
    
    while (accumulator >= FIXED_TIME_STEP && steps < maxSteps) {
        stepPhysics(FIXED_TIME_STEP);
        accumulator -= FIXED_TIME_STEP;
        steps++;
    }
    
    // If we hit the max steps, drain the accumulator to prevent slowdown
    if (steps >= maxSteps && accumulator > FIXED_TIME_STEP) {
        console.warn('Physics system overloaded, draining accumulator');
        accumulator = 0;
    }
}


/**
 * Pause/resume the physics simulation
 * @param {boolean} shouldRun - Whether the simulation should run
 */
function setPhysicsRunning(shouldRun) {
    isRunning = shouldRun;
}

/**
 * Calculate a stabilizing force to keep the kite in view
 * @param {Object} kite - Kite properties
 * @returns {Object} The stabilizing force vector {x, y, z}
 */
function calculateStabilizingForce(kite) {
    // Calculate horizontal distance from origin
    const horizontalDistanceSquared = 
        kite.position.x * kite.position.x + 
        kite.position.z * kite.position.z;
    
    // Calculate vertical distance from desired height
    const desiredHeight = 5.0; // Target height
    const verticalDistance = desiredHeight - kite.position.y;
    
    // Apply gentle horizontal centering force if kite is too far from center
    let horizontalForce = { x: 0, z: 0 };
    if (horizontalDistanceSquared > 900) { // 30 meters squared
        // Calculate direction to origin
        const horizontalDistance = Math.sqrt(horizontalDistanceSquared);
        horizontalForce = {
            x: -kite.position.x / horizontalDistance * 0.05,
            z: -kite.position.z / horizontalDistance * 0.05
        };
    }
    
    // Apply gentle vertical centering force
    const verticalForce = verticalDistance * 0.01;
    
    return {
        x: horizontalForce.x,
        y: verticalForce,
        z: horizontalForce.z
    };
}

/**
 * Calculate aerodynamic forces (lift and drag) based on kite orientation and wind
 * @param {Object} kite - Kite properties
 * @returns {Object} Lift and drag force vectors
 */
function calculateAerodynamicForces(kite) {
    const windDirection = getWindDirection();
    const windSpeed = getWindSpeed();
    const kiteVelocity = kite.velocity;
    
    // Calculate relative velocity (wind - kite)
    const relativeVelocity = {
        x: windDirection.x * windSpeed - kiteVelocity.x,
        y: windDirection.y * windSpeed - kiteVelocity.y,
        z: windDirection.z * windSpeed - kiteVelocity.z
    };
    
    // Calculate velocity magnitude
    const velocityMagSquared = 
        relativeVelocity.x * relativeVelocity.x + 
        relativeVelocity.y * relativeVelocity.y + 
        relativeVelocity.z * relativeVelocity.z;
    
    const velocityMag = Math.sqrt(velocityMagSquared);
    
    // Avoid division by zero
    if (velocityMag < 0.0001) {
        return {
            lift: { x: 0, y: 0, z: 0 },
            drag: { x: 0, y: 0, z: 0 }
        };
    }
    
    // Normalize relative velocity
    const relVelNorm = {
        x: relativeVelocity.x / velocityMag,
        y: relativeVelocity.y / velocityMag,
        z: relativeVelocity.z / velocityMag
    };
    
    // Get kite orientation (normal vector pointing out from kite surface)
    // This is simplified - in a real implementation, we'd use the kite's rotation matrix
    const kiteNormal = {
        x: Math.sin(kite.rotation.y) * Math.cos(kite.rotation.x),
        y: Math.sin(kite.rotation.x),
        z: Math.cos(kite.rotation.y) * Math.cos(kite.rotation.x)
    };
    
    // Calculate angle of attack (angle between relative velocity and kite normal)
    // Dot product of normalized vectors gives cosine of angle
    const dotProduct = 
        relVelNorm.x * kiteNormal.x + 
        relVelNorm.y * kiteNormal.y + 
        relVelNorm.z * kiteNormal.z;
    
    // Clamp dot product to [-1, 1] range to avoid math errors
    const clampedDot = Math.max(-1, Math.min(1, dotProduct));
    const angleOfAttack = Math.acos(clampedDot);
    
    // Calculate lift coefficient based on angle of attack
    // This is a simplified model - real airfoils have complex lift curves
    // Optimal angle of attack is around 15 degrees (0.26 radians)
    const optimalAoA = 0.26;
    const maxLiftCoef = 1.2;
    
    // Simple lift coefficient model: sin(2*AoA) gives max lift at 45 degrees
    // but we'll adjust it to peak at our optimal AoA
    let liftCoef = maxLiftCoef * Math.sin(2 * angleOfAttack * (Math.PI/4) / optimalAoA);
    
    // Stall behavior: lift drops off after critical angle (about 15-20 degrees)
    if (angleOfAttack > optimalAoA * 1.3) {
        // Reduce lift coefficient after stall angle
        const stallFactor = 1 - Math.min(1, (angleOfAttack - optimalAoA * 1.3) / (Math.PI/2 - optimalAoA * 1.3));
        liftCoef *= stallFactor;
    }
    
    // Calculate drag coefficient based on angle of attack
    // Drag increases with AoA
    const minDragCoef = 0.05; // Minimum drag coefficient (at zero AoA)
    const dragCoef = minDragCoef + kite.dragCoefficient * Math.sin(angleOfAttack);
    
    // Calculate lift direction (perpendicular to relative velocity and in the plane of kite normal)
    // Cross product of relative velocity and kite normal
    const crossProduct = {
        x: relVelNorm.y * kiteNormal.z - relVelNorm.z * kiteNormal.y,
        y: relVelNorm.z * kiteNormal.x - relVelNorm.x * kiteNormal.z,
        z: relVelNorm.x * kiteNormal.y - relVelNorm.y * kiteNormal.x
    };
    
    // Normalize cross product
    const crossMag = Math.sqrt(
        crossProduct.x * crossProduct.x + 
        crossProduct.y * crossProduct.y + 
        crossProduct.z * crossProduct.z
    );
    
    // If cross product is too small, lift direction is undefined
    // This happens when relative velocity and kite normal are parallel
    let liftDirection;
    if (crossMag < 0.0001) {
        // Default lift direction (upward)
        liftDirection = { x: 0, y: 1, z: 0 };
    } else {
        // Normalize cross product
        const crossNorm = {
            x: crossProduct.x / crossMag,
            y: crossProduct.y / crossMag,
            z: crossProduct.z / crossMag
        };
        
        // Lift direction is perpendicular to both relative velocity and cross product
        liftDirection = {
            x: relVelNorm.y * crossNorm.z - relVelNorm.z * crossNorm.y,
            y: relVelNorm.z * crossNorm.x - relVelNorm.x * crossNorm.z,
            z: relVelNorm.x * crossNorm.y - relVelNorm.y * crossNorm.x
        };
    }
    
    // Calculate force magnitudes
    // F = 0.5 * rho * v^2 * C * A
    const forceFactor = 0.5 * AIR_DENSITY * velocityMagSquared * kite.area;
    const liftMagnitude = forceFactor * liftCoef;
    const dragMagnitude = forceFactor * dragCoef;
    
    // Calculate lift force components
    const liftForce = {
        x: liftDirection.x * liftMagnitude,
        y: liftDirection.y * liftMagnitude,
        z: liftDirection.z * liftMagnitude
    };
    
    // Calculate drag force components (opposite to relative velocity)
    const dragForce = {
        x: -relVelNorm.x * dragMagnitude,
        y: -relVelNorm.y * dragMagnitude,
        z: -relVelNorm.z * dragMagnitude
    };
    
    return {
        lift: liftForce,
        drag: dragForce,
        angleOfAttack: angleOfAttack // Return AoA for telemetry
    };
}

/**
 * Calculate and apply torque to the kite
 * @param {Object} kite - Kite properties
 * @param {Object} tetherForces - Forces from tethers
 */
function calculateAndApplyTorque(kite, tetherForces) {
    // Get current kite properties
    const kitePosition = kite.position;
    
    // Get tether configuration
    const tetherConfig = getTetherConfig();
    
    // Get bridle connection point in world space
    const bridleConnection = {
        x: kitePosition.x + kite.bridle.connectionPoint.x,
        y: kitePosition.y + kite.bridle.connectionPoint.y,
        z: kitePosition.z + kite.bridle.connectionPoint.z
    };
    
    // Calculate positions of the operator's hands
    const operatorLeft = {
        x: tetherConfig.operatorPosition.x - 0.5,
        y: tetherConfig.operatorPosition.y + 1.0,
        z: tetherConfig.operatorPosition.z
    };
    
    const operatorRight = {
        x: tetherConfig.operatorPosition.x + 0.5,
        y: tetherConfig.operatorPosition.y + 1.0,
        z: tetherConfig.operatorPosition.z
    };
    
    // Get tether forces for tension calculation
    const tetherForceValues = getTetherForces();
    
    // Use a simple approximation for left and right tensions
    // In a real implementation, we'd get these directly from the tether system
    const leftTension = tetherForceValues.x * 0.5;
    const rightTension = tetherForceValues.x * 0.5;
    
    // Calculate direction vectors from bridle connection to operator hands
    const leftDir = {
        x: operatorLeft.x - bridleConnection.x,
        y: operatorLeft.y - bridleConnection.y,
        z: operatorLeft.z - bridleConnection.z
    };
    
    const rightDir = {
        x: operatorRight.x - bridleConnection.x,
        y: operatorRight.y - bridleConnection.y,
        z: operatorRight.z - bridleConnection.z
    };
    
    // Normalize direction vectors
    const leftMag = Math.sqrt(leftDir.x*leftDir.x + leftDir.y*leftDir.y + leftDir.z*leftDir.z);
    const rightMag = Math.sqrt(rightDir.x*rightDir.x + rightDir.y*rightDir.y + rightDir.z*rightDir.z);
    
    if (leftMag > 0.0001) {
        leftDir.x /= leftMag;
        leftDir.y /= leftMag;
        leftDir.z /= leftMag;
    }
    
    if (rightMag > 0.0001) {
        rightDir.x /= rightMag;
        rightDir.y /= rightMag;
        rightDir.z /= rightMag;
    }
    
    // Calculate moment arms (vectors from center of mass to attachment points)
    const bridleArm = {
        x: kite.bridle.connectionPoint.x,
        y: kite.bridle.connectionPoint.y,
        z: kite.bridle.connectionPoint.z
    };
    
    // Calculate forces at bridle connection
    const leftForce = {
        x: leftDir.x * leftTension,
        y: leftDir.y * leftTension,
        z: leftDir.z * leftTension
    };
    
    const rightForce = {
        x: rightDir.x * rightTension,
        y: rightDir.y * rightTension,
        z: rightDir.z * rightTension
    };
    
    // Combine left and right forces
    const totalForce = {
        x: leftForce.x + rightForce.x,
        y: leftForce.y + rightForce.y,
        z: leftForce.z + rightForce.z
    };
    
    // Calculate torque as cross product: τ = r × F
    // For each axis, the torque is calculated by the components perpendicular to that axis
    const torque = {
        // Rotation around X axis (affected by Y and Z components)
        x: bridleArm.y * totalForce.z - bridleArm.z * totalForce.y,
        
        // Rotation around Y axis (affected by X and Z components)
        y: bridleArm.z * totalForce.x - bridleArm.x * totalForce.z,
        
        // Rotation around Z axis (affected by X and Y components)
        z: bridleArm.x * totalForce.y - bridleArm.y * totalForce.x
    };
    
    // Calculate differential torque component (this is what makes the kite turn)
    // When left tension is higher than right, the kite should rotate right (negative Y torque)
    // When right tension is higher than left, the kite should rotate left (positive Y torque)
    const tensionDifference = rightTension - leftTension;
    const differentialTorqueFactor = 0.5;  // Scale factor to adjust sensitivity
    
    // Add differential torque primarily to Y axis (for left/right turning)
    torque.y += tensionDifference * differentialTorqueFactor;
    
    // Apply stabilizing torque to prevent unrealistic rotations
    // This helps maintain a reasonable kite orientation
    const stabilizingTorque = {
        // Resist pitch (X rotation) - try to keep kite at a reasonable angle
        x: -Math.sin(kite.rotation.x) * 0.1,
        
        // Minimal resistance to yaw (Y rotation) - allow turning
        y: -Math.sin(kite.rotation.y) * 0.01,
        
        // Strong resistance to roll (Z rotation) - kites don't roll much
        z: -Math.sin(kite.rotation.z) * 0.2
    };
    
    // Add stabilizing torque
    torque.x += stabilizingTorque.x;
    torque.y += stabilizingTorque.y;
    torque.z += stabilizingTorque.z;
    
    // Add damping torque proportional to angular velocity
    const dampingFactor = 0.15;
    const dampingTorque = {
        x: -kite.angularVelocity.x * dampingFactor,
        y: -kite.angularVelocity.y * dampingFactor,
        z: -kite.angularVelocity.z * dampingFactor
    };
    
    // Add damping torque
    torque.x += dampingTorque.x;
    torque.y += dampingTorque.y;
    torque.z += dampingTorque.z;
    
    // Scale down torque overall for stability
    const torqueScaleFactor = 0.3;
    torque.x *= torqueScaleFactor;
    torque.y *= torqueScaleFactor;
    torque.z *= torqueScaleFactor;
    
    // Apply torque to kite
    applyTorque(torque);
}

/**
 * Get current physics configuration
 * @returns {Object} Current physics configuration
 */
function getPhysicsConfig() {
    return { ...config }; // Return a copy to prevent direct modification
}

/**
 * Update physics engine configuration
 * @param {Object} newConfig - New configuration values
 */
function updatePhysicsConfig(newConfig) {
    // Update configuration with new values
    if (newConfig.timeScale !== undefined) config.timeScale = newConfig.timeScale;
    if (newConfig.simulationStepsPerFrame !== undefined) config.simulationStepsPerFrame = newConfig.simulationStepsPerFrame;
    if (newConfig.enableGravity !== undefined) config.enableGravity = newConfig.enableGravity;
    if (newConfig.enableWind !== undefined) config.enableWind = newConfig.enableWind;
    if (newConfig.enableDrag !== undefined) config.enableDrag = newConfig.enableDrag;
    if (newConfig.enableCollisions !== undefined) config.enableCollisions = newConfig.enableCollisions;
}

// Export public functions
export {
    initPhysics,
    updatePhysics,
    updatePhysicsConfig,
    setPhysicsRunning,
    getPhysicsConfig
};
