/**
 * KITE FLYING SIMULATOR - PHYSICS IMPLEMENTATION GUIDE
 * 
 * This file provides a comprehensive example of how to implement the physics
 * for Stage 2 of the stunt kite simulator. It includes detailed comments and
 * explanations of all calculations to serve as a reference.
 * 
 * This is NOT meant to be used directly in the codebase, but rather as
 * a guide for implementing the actual physics engine.
 */

// Constants
const GRAVITY = 9.81;          // Gravitational acceleration (m/s²)
const AIR_DENSITY = 1.225;     // Air density at sea level (kg/m³)
const TIME_STEP = 1/60;        // Fixed physics time step (60Hz)

/**
 * KITE PROPERTIES EXAMPLE
 * 
 * This object defines the physical properties of a kite that affect its flight dynamics.
 */
const kiteProperties = {
    // Basic properties
    mass: 0.5,                 // Mass in kg
    area: 1.2,                 // Surface area in m²
    wingspan: 2.0,             // Width in meters
    
    // Aerodynamic coefficients
    dragCoefficient: 0.8,      // Base drag coefficient
    liftCoefficient: 1.2,      // Base lift coefficient
    
    // State variables
    position: { x: 0, y: 2, z: 0 },           // Position in 3D space (meters)
    velocity: { x: 0, y: 0, z: 0 },           // Velocity (m/s)
    acceleration: { x: 0, y: 0, z: 0 },       // Acceleration (m/s²)
    
    // Orientation (Euler angles in radians)
    rotation: { x: 0, y: 0, z: 0 },           // Pitch, yaw, roll
    angularVelocity: { x: 0, y: 0, z: 0 },    // Angular velocity (rad/s)
    
    // Tether attachment points (relative to kite center)
    leftAttachPoint: { x: -1.0, y: 0, z: 0 },
    rightAttachPoint: { x: 1.0, y: 0, z: 0 }
};

/**
 * WIND PROPERTIES EXAMPLE
 * 
 * This object defines the wind conditions that affect kite flight.
 */
const windProperties = {
    baseSpeed: 5.0,            // Base wind speed (m/s)
    direction: { x: 0, y: 0, z: 1 },  // Wind direction (normalized)
    gustStrength: 0.2,         // Gust strength as fraction of base speed
    turbulence: 0.1,           // Turbulence magnitude (0-1)
    
    // Current values (will be updated dynamically)
    currentSpeed: 5.0,
    currentDirection: { x: 0, y: 0, z: 1 }
};

/**
 * TETHER PROPERTIES EXAMPLE
 * 
 * This object defines the properties of the control lines.
 */
const tetherProperties = {
    // Line properties
    length: 30,                // Line length in meters
    elasticity: 0.05,          // Elasticity coefficient (spring constant)
    damping: 0.1,              // Damping coefficient for oscillations
    
    // Operator position (fixed on ground)
    operatorPosition: { x: 0, y: 0, z: -30 },
    
    // Control inputs (0-1 range)
    leftInput: 0.5,            // Left line input (0.5 is neutral)
    rightInput: 0.5,           // Right line input (0.5 is neutral)
    
    // Current values (calculated based on inputs)
    leftTension: 0,
    rightTension: 0
};

/**
 * Main physics update function - called each frame
 * @param {number} deltaTime - Time since last frame in seconds
 */
function updatePhysics(deltaTime) {
    // Use fixed time step for stable physics
    const subSteps = Math.ceil(deltaTime / TIME_STEP);
    const dt = deltaTime / subSteps;
    
    for (let i = 0; i < subSteps; i++) {
        updateWindConditions(dt);
        calculateTetherForces();
        calculateKiteForces(dt);
        integrateMotion(dt);
        checkCollisions();
    }
}

/**
 * Update wind conditions with variations
 * @param {number} dt - Time step in seconds
 */
function updateWindConditions(dt) {
    // Get current time for periodic variations
    const time = performance.now() / 1000;
    
    // Calculate gust effect using sine wave
    const gustFactor = Math.sin(time * 0.5) * windProperties.gustStrength;
    
    // Add random turbulence
    const turbulenceFactor = (Math.random() - 0.5) * windProperties.turbulence;
    
    // Combine factors (ensure wind doesn't go negative)
    const variationFactor = Math.max(0.1, 1.0 + gustFactor + turbulenceFactor);
    
    // Update current wind speed
    windProperties.currentSpeed = windProperties.baseSpeed * variationFactor;
    
    // Slightly vary direction for realism
    const directionVariation = windProperties.turbulence * 0.1;
    windProperties.currentDirection = {
        x: windProperties.direction.x + (Math.random() - 0.5) * directionVariation,
        y: windProperties.direction.y + (Math.random() - 0.5) * directionVariation, 
        z: windProperties.direction.z + (Math.random() - 0.5) * directionVariation
    };
    
    // Normalize direction vector
    const mag = Math.sqrt(
        windProperties.currentDirection.x * windProperties.currentDirection.x +
        windProperties.currentDirection.y * windProperties.currentDirection.y +
        windProperties.currentDirection.z * windProperties.currentDirection.z
    );
    
    windProperties.currentDirection.x /= mag;
    windProperties.currentDirection.y /= mag;
    windProperties.currentDirection.z /= mag;
}

/**
 * Calculate tether (line) forces
 */
function calculateTetherForces() {
    // Calculate positions of the kite attachment points in world space
    const leftAttach = {
        x: kiteProperties.position.x + kiteProperties.leftAttachPoint.x,
        y: kiteProperties.position.y + kiteProperties.leftAttachPoint.y,
        z: kiteProperties.position.z + kiteProperties.leftAttachPoint.z
    };
    
    const rightAttach = {
        x: kiteProperties.position.x + kiteProperties.rightAttachPoint.x,
        y: kiteProperties.position.y + kiteProperties.rightAttachPoint.y,
        z: kiteProperties.position.z + kiteProperties.rightAttachPoint.z
    };
    
    // Calculate positions of the operator's hands
    const operatorLeft = {
        x: tetherProperties.operatorPosition.x - 0.5, // Hands 1m apart
        y: tetherProperties.operatorPosition.y + 1.0, // Hands at 1m height
        z: tetherProperties.operatorPosition.z
    };
    
    const operatorRight = {
        x: tetherProperties.operatorPosition.x + 0.5,
        y: tetherProperties.operatorPosition.y + 1.0,
        z: tetherProperties.operatorPosition.z
    };
    
    // Calculate distances between attach points and operator hands
    const leftDistance = calculateDistance(leftAttach, operatorLeft);
    const rightDistance = calculateDistance(rightAttach, operatorRight);
    
    // Calculate effective line lengths based on control inputs
    // Input of 1.0 reduces effective length by 30% (simulates pulling the line)
    const leftInputFactor = 1.0 - (tetherProperties.leftInput * 0.3);
    const rightInputFactor = 1.0 - (tetherProperties.rightInput * 0.3);
    
    const leftEffectiveLength = tetherProperties.length * leftInputFactor;
    const rightEffectiveLength = tetherProperties.length * rightInputFactor;
    
    // Calculate strain (distance / effectiveLength - 1)
    // If distance > effectiveLength, line is stretched (positive strain)
    // If distance < effectiveLength, line is slack (clamp to 0)
    const leftStrain = Math.max(0, leftDistance / leftEffectiveLength - 1);
    const rightStrain = Math.max(0, rightDistance / rightEffectiveLength - 1);
    
    // Calculate tension using Hooke's law with nonlinear term for large strain
    // F = k * strain * (1 + strain)
    tetherProperties.leftTension = tetherProperties.elasticity * leftStrain * (1 + leftStrain);
    tetherProperties.rightTension = tetherProperties.elasticity * rightStrain * (1 + rightStrain);
    
    // Calculate direction vectors from attachments to operator hands
    const leftDir = {
        x: operatorLeft.x - leftAttach.x,
        y: operatorLeft.y - leftAttach.y,
        z: operatorLeft.z - leftAttach.z
    };
    
    const rightDir = {
        x: operatorRight.x - rightAttach.x,
        y: operatorRight.y - rightAttach.y,
        z: operatorRight.z - rightAttach.z
    };
    
    // Normalize direction vectors
    const leftMag = Math.sqrt(leftDir.x*leftDir.x + leftDir.y*leftDir.y + leftDir.z*leftDir.z);
    const rightMag = Math.sqrt(rightDir.x*rightDir.x + rightDir.y*rightDir.y + rightDir.z*rightDir.z);
    
    if (leftMag > 0) {
        leftDir.x /= leftMag;
        leftDir.y /= leftMag;
        leftDir.z /= leftMag;
    }
    
    if (rightMag > 0) {
        rightDir.x /= rightMag;
        rightDir.y /= rightMag;
        rightDir.z /= rightMag;
    }
    
    // Store tension vectors (will be used in force calculation)
    tetherProperties.leftTensionVector = {
        x: leftDir.x * tetherProperties.leftTension,
        y: leftDir.y * tetherProperties.leftTension,
        z: leftDir.z * tetherProperties.leftTension
    };
    
    tetherProperties.rightTensionVector = {
        x: rightDir.x * tetherProperties.rightTension,
        y: rightDir.y * tetherProperties.rightTension,
        z: rightDir.z * tetherProperties.rightTension
    };
}

/**
 * Calculate all forces acting on the kite
 * @param {number} dt - Time step in seconds
 */
function calculateKiteForces(dt) {
    // Reset acceleration
    kiteProperties.acceleration = { x: 0, y: 0, z: 0 };
    
    // 1. Apply gravity
    applyForce({
        x: 0,
        y: -GRAVITY * kiteProperties.mass,
        z: 0
    });
    
    // 2. Apply aerodynamic forces (wind)
    calculateAerodynamicForces();
    
    // 3. Apply tether forces
    applyForce(tetherProperties.leftTensionVector, kiteProperties.leftAttachPoint);
    applyForce(tetherProperties.rightTensionVector, kiteProperties.rightAttachPoint);
    
    // 4. Apply damping (air resistance)
    const dampingFactor = 0.01;
    applyForce({
        x: -kiteProperties.velocity.x * dampingFactor,
        y: -kiteProperties.velocity.y * dampingFactor,
        z: -kiteProperties.velocity.z * dampingFactor
    });
}

/**
 * Calculate aerodynamic forces (lift and drag)
 */
function calculateAerodynamicForces() {
    // Calculate relative velocity (wind - kite)
    const relativeVelocity = {
        x: windProperties.currentDirection.x * windProperties.currentSpeed - kiteProperties.velocity.x,
        y: windProperties.currentDirection.y * windProperties.currentSpeed - kiteProperties.velocity.y,
        z: windProperties.currentDirection.z * windProperties.currentSpeed - kiteProperties.velocity.z
    };
    
    // Calculate magnitude of relative velocity
    const relVelMag = Math.sqrt(
        relativeVelocity.x * relativeVelocity.x +
        relativeVelocity.y * relativeVelocity.y +
        relativeVelocity.z * relativeVelocity.z
    );
    
    // Early exit if no relative velocity (avoid division by zero)
    if (relVelMag < 0.0001) return;
    
    // Normalize relative velocity
    const relVelDir = {
        x: relativeVelocity.x / relVelMag,
        y: relativeVelocity.y / relVelMag,
        z: relativeVelocity.z / relVelMag
    };
    
    // Calculate kite's normal vector (simplified - based on orientation)
    // This calculation would be more complex with proper quaternion rotation
    const kiteNormal = {
        x: 0,
        y: Math.sin(kiteProperties.rotation.x),
        z: Math.cos(kiteProperties.rotation.x)
    };
    
    // Normalize kite normal
    const normMag = Math.sqrt(
        kiteNormal.x * kiteNormal.x +
        kiteNormal.y * kiteNormal.y +
        kiteNormal.z * kiteNormal.z
    );
    
    kiteNormal.x /= normMag;
    kiteNormal.y /= normMag;
    kiteNormal.z /= normMag;
    
    // Calculate angle of attack (angle between relative velocity and kite normal)
    const dotProduct = 
        kiteNormal.x * relVelDir.x +
        kiteNormal.y * relVelDir.y +
        kiteNormal.z * relVelDir.z;
    
    // Angle between vectors = acos(dot product)
    const angleOfAttack = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
    
    // Calculate lift and drag coefficients based on angle of attack
    // These are simplified coefficient models
    const effectiveDragCoef = kiteProperties.dragCoefficient * (0.5 + 0.5 * Math.sin(angleOfAttack));
    const effectiveLiftCoef = kiteProperties.liftCoefficient * Math.sin(2 * angleOfAttack);
    
    // Calculate drag force magnitude: F_drag = 0.5 * rho * v^2 * Cd * A
    const dragMagnitude = 0.5 * AIR_DENSITY * relVelMag * relVelMag * 
                         effectiveDragCoef * kiteProperties.area;
    
    // Drag force acts opposite to relative velocity
    const dragForce = {
        x: -dragMagnitude * relVelDir.x,
        y: -dragMagnitude * relVelDir.y,
        z: -dragMagnitude * relVelDir.z
    };
    
    // Calculate lift force
    // Lift direction is perpendicular to both the relative velocity and the wingspan axis
    
    // First define the wingspan axis (simplified, pointing along x-axis)
    const wingspanAxis = { x: 1, y: 0, z: 0 };
    
    // Calculate lift direction: cross product of relative velocity and wingspan axis
    const liftDir = crossProduct(relVelDir, wingspanAxis);
    
    // Normalize lift direction
    const liftMag = Math.sqrt(
        liftDir.x * liftDir.x +
        liftDir.y * liftDir.y +
        liftDir.z * liftDir.z
    );
    
    if (liftMag > 0.0001) {
        liftDir.x /= liftMag;
        liftDir.y /= liftMag;
        liftDir.z /= liftMag;
        
        // Calculate lift force magnitude: F_lift = 0.5 * rho * v^2 * Cl * A
        const liftMagnitude = 0.5 * AIR_DENSITY * relVelMag * relVelMag * 
                             effectiveLiftCoef * kiteProperties.area;
        
        // Lift force acts perpendicular to relative velocity
        const liftForce = {
            x: liftMagnitude * liftDir.x,
            y: liftMagnitude * liftDir.y,
            z: liftMagnitude * liftDir.z
        };
        
        // Apply lift force
        applyForce(liftForce);
    }
    
    // Apply drag force
    applyForce(dragForce);
}

/**
 * Integrate motion equations to update position and velocity
 * @param {number} dt - Time step in seconds
 */
function integrateMotion(dt) {
    // Semi-implicit Euler integration
    
    // Update velocity based on acceleration
    kiteProperties.velocity.x += kiteProperties.acceleration.x * dt;
    kiteProperties.velocity.y += kiteProperties.acceleration.y * dt;
    kiteProperties.velocity.z += kiteProperties.acceleration.z * dt;
    
    // Update position based on velocity
    kiteProperties.position.x += kiteProperties.velocity.x * dt;
    kiteProperties.position.y += kiteProperties.velocity.y * dt;
    kiteProperties.position.z += kiteProperties.velocity.z * dt;
    
    // TODO: Add rotational dynamics integration
    // This would update kite orientation based on torques
}

/**
 * Check for and handle collisions
 */
function checkCollisions() {
    // Check ground collision (y = 0 plane)
    if (kiteProperties.position.y < 0.1) {
        // Reset velocity with some damping (bouncing effect)
        kiteProperties.velocity.x *= 0.8;
        kiteProperties.velocity.y = 0; // Stop vertical movement
        kiteProperties.velocity.z *= 0.8;
        
        // Place kite slightly above ground
        kiteProperties.position.y = 0.1;
    }
}

/**
 * Apply a force to the kite
 * @param {Object} force - Force vector {x, y, z}
 * @param {Object} [point] - Application point relative to center of mass (for torque)
 */
function applyForce(force, point) {
    // F = m*a, so a = F/m
    kiteProperties.acceleration.x += force.x / kiteProperties.mass;
    kiteProperties.acceleration.y += force.y / kiteProperties.mass;
    kiteProperties.acceleration.z += force.z / kiteProperties.mass;
    
    // If a point of application is provided, calculate torque
    if (point) {
        // τ = r × F (cross product of position and force)
        const torque = crossProduct(point, force);
        
        // TODO: Calculate angular acceleration based on torque and moment of inertia
        // This requires a more complex model of the kite's inertia tensor
    }
}

/**
 * Calculate distance between two points
 * @param {Object} p1 - First point {x, y, z}
 * @param {Object} p2 - Second point {x, y, z}
 * @returns {number} Distance
 */
function calculateDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

/**
 * Calculate cross product of two vectors
 * @param {Object} a - First vector {x, y, z}
 * @param {Object} b - Second vector {x, y, z}
 * @returns {Object} Resulting vector {x, y, z}
 */
function crossProduct(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

/**
 * Utility: Normalize a vector
 * @param {Object} v - Vector to normalize {x, y, z}
 * @returns {Object} Normalized vector
 */
function normalizeVector(v) {
    const mag = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    if (mag < 0.0001) return { x: 0, y: 0, z: 0 };
    
    return {
        x: v.x / mag,
        y: v.y / mag,
        z: v.z / mag
    };
}

// Export functions for reference
// In actual implementation, these would be properly modularized
/*
export {
    updatePhysics,
    kiteProperties,
    windProperties,
    tetherProperties
};
*/
