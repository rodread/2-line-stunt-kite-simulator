/**
 * Kite Flying Simulator - Tether System
 * 
 * This module handles the kite lines (tethers), including:
 * - Line physics (tension, elasticity)
 * - Line visualization
 * - Line input and manipulation
 */

import * as THREE from 'three';
import { getScene } from '../world.js';
import { getKitePosition, getKiteProperties } from '../kite.js';

// Tether configuration
const tetherConfig = {
    // Line properties
    leftLineLength: 30.0, // meters
    rightLineLength: 30.0, // meters
    lineTension: 0.0, // 0-1, where 0 is loose and 1 is fully tensioned
    lineElasticity: 0.05, // Elasticity coefficient
    lineDrag: 0.02, // Line drag coefficient
    
    // Operator properties (fixed position on the ground)
    operatorPosition: { x: 0, y: 0, z: -10 }, // Position of the kite operator
    
    // Control inputs (0-1)
    leftInput: 0.5, // Default middle position
    rightInput: 0.5,
    
    // Line length adjustments
    overallLengthAdjustment: 0.0, // -1 to 1 (shorter to longer)
    differentialLengthAdjustment: 0.0 // -1 to 1 (left shorter to right shorter)
};

// Lines visualization
let leftLine = null;
let rightLine = null;

// Line attachment points (these will be updated)
let leftAttachPoint = { x: -0.5, y: 0, z: 0 }; // Relative to kite
let rightAttachPoint = { x: 0.5, y: 0, z: 0 }; // Relative to kite

/**
 * Initialize the tether system
 */
function initTethers() {
    console.log('Initializing tether system...');
    
    // Create visual representation of the lines
    createTetherVisuals();
    
    // TODO: Stage 2 - Add more sophisticated tether model
}

/**
 * Create visual representation of tethers
 */
function createTetherVisuals() {
    const scene = getScene();
    
    // Create left line with improved visibility
    const leftMaterial = new THREE.LineBasicMaterial({ 
        color: 0xFFFF00, // Yellow for better visibility
        linewidth: 3 // Increased width (note: may not work on all platforms due to WebGL limitations)
    });
    
    const leftGeometry = new THREE.BufferGeometry();
    // Initial positions will be updated in updateTethers()
    const leftPositions = new Float32Array(6); // Two points (xyz, xyz)
    leftGeometry.setAttribute('position', new THREE.BufferAttribute(leftPositions, 3));
    
    // Create a tube geometry for the left line to make it more visible
    leftLine = new THREE.Line(leftGeometry, leftMaterial);
    scene.add(leftLine);
    
    // Create right line with improved visibility
    const rightMaterial = new THREE.LineBasicMaterial({ 
        color: 0xFF00FF, // Magenta for better visibility and to distinguish from left line
        linewidth: 3 // Increased width
    });
    
    const rightGeometry = new THREE.BufferGeometry();
    const rightPositions = new Float32Array(6); // Two points (xyz, xyz)
    rightGeometry.setAttribute('position', new THREE.BufferAttribute(rightPositions, 3));
    
    rightLine = new THREE.Line(rightGeometry, rightMaterial);
    scene.add(rightLine);
}

/**
 * Update tethers for the current frame
 * @param {number} deltaTime - Time since last frame in seconds
 */
function updateTethers(deltaTime) {
    // Update effective line lengths based on control inputs
    updateEffectiveLineLengths();
    
    // Calculate line forces based on positions and lengths
    calculateTetherForces();
    
    // Update visual representation of the lines
    updateTetherVisuals();
}

/**
 * Update the effective line lengths based on control inputs
 */
function updateEffectiveLineLengths() {
    // Base line length (adjusted by overall length control)
    const baseLengthFactor = 1.0 + tetherConfig.overallLengthAdjustment * 0.5; // ±50% length adjustment
    const baseLength = 30.0 * baseLengthFactor;
    
    // Apply differential adjustment
    const diffFactor = tetherConfig.differentialLengthAdjustment * 0.2; // ±20% differential
    
    // Calculate effective lengths
    tetherConfig.leftLineLength = baseLength * (1 - diffFactor);
    tetherConfig.rightLineLength = baseLength * (1 + diffFactor);
    
    // TODO: Stage 2 - Add more sophisticated length calculations
}

/**
 * Calculate forces applied by the tethers
 */
function calculateTetherForces() {
    // Get current kite properties
    const kite = getKiteProperties();
    
    // Get bridle connection point in world space
    // This is where the tethers connect to the bridle system
    const bridleConnection = {
        x: kite.position.x + kite.bridle.connectionPoint.x,
        y: kite.position.y + kite.bridle.connectionPoint.y,
        z: kite.position.z + kite.bridle.connectionPoint.z
    };
    
    // For backward compatibility, we'll still calculate forces to the original attachment points
    // but we'll apply them to the bridle connection point
    const leftAttach = {
        x: kite.position.x + leftAttachPoint.x,
        y: kite.position.y + leftAttachPoint.y,
        z: kite.position.z + leftAttachPoint.z
    };
    
    const rightAttach = {
        x: kite.position.x + rightAttachPoint.x,
        y: kite.position.y + rightAttachPoint.y,
        z: kite.position.z + rightAttachPoint.z
    };
    
    // Calculate positions of the operator's hands
    const operatorLeft = {
        x: tetherConfig.operatorPosition.x - 0.5, // Hands are 1m apart
        y: tetherConfig.operatorPosition.y + 1.0, // Hands are at 1m height
        z: tetherConfig.operatorPosition.z
    };
    
    const operatorRight = {
        x: tetherConfig.operatorPosition.x + 0.5,
        y: tetherConfig.operatorPosition.y + 1.0,
        z: tetherConfig.operatorPosition.z
    };
    
    // Calculate distances
    const leftDistance = calculateDistance(leftAttach, operatorLeft);
    const rightDistance = calculateDistance(rightAttach, operatorRight);
    
        // Calculate line tension based on distance vs. line length
        // Apply stronger tension when the kite is near the ground to prevent it from falling through
        const groundProximityFactor = Math.max(1.0, 2.0 * (1.0 - Math.min(1.0, bridleConnection.y / 5.0)));
        
        const leftTension = calculateLineTension(leftDistance, tetherConfig.leftLineLength, tetherConfig.leftInput) * groundProximityFactor;
        const rightTension = calculateLineTension(rightDistance, tetherConfig.rightLineLength, tetherConfig.rightInput) * groundProximityFactor;
    
    // TODO: Stage 2 - Calculate actual forces applied to the kite
    
    // Return calculated tensions
    return {
        leftTension,
        rightTension,
        leftDistance,
        rightDistance
    };
}

/**
 * Calculate distance between two points
 * @param {Object} point1 - First point {x, y, z}
 * @param {Object} point2 - Second point {x, y, z}
 * @returns {number} Distance
 */
function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

/**
 * Calculate line tension based on distance, length, and input
 * @param {number} distance - Current distance between attachment points
 * @param {number} lineLength - Nominal line length
 * @param {number} input - Control input (0-1)
 * @returns {number} Tension force magnitude
 */
function calculateLineTension(distance, lineLength, input) {
    // Calculate effective line length based on input
    // When input is 1 (full pull), the effective length is reduced
    const inputFactor = 1.0 - (input * 0.3); // Input can reduce length by up to 30%
    const effectiveLength = lineLength * inputFactor;
    
    // Calculate strain (distance / length - 1)
    // If distance > effectiveLength, line is stretched (positive strain)
    // If distance < effectiveLength, line is slack (strain clamped to 0)
    const strain = Math.max(0, distance / effectiveLength - 1);
    
    // Tension is proportional to strain (Hooke's law with nonlinear term)
    // F = k * strain + k2 * strain^2
    const tension = tetherConfig.lineElasticity * strain * (1 + strain);
    
    return tension;
}

/**
 * Update the visual representation of the tethers
 */
function updateTetherVisuals() {
    if (!leftLine || !rightLine) return;
    
    // Get current kite properties
    const kite = getKiteProperties();
    
    // Get bridle connection point in world space
    // This is where the tethers connect to the bridle system
    const bridleConnection = {
        x: kite.position.x + kite.bridle.connectionPoint.x,
        y: kite.position.y + kite.bridle.connectionPoint.y,
        z: kite.position.z + kite.bridle.connectionPoint.z
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
    
    // Update left line geometry - connect to bridle connection point
    const leftPositions = leftLine.geometry.attributes.position.array;
    
    leftPositions[0] = operatorLeft.x;
    leftPositions[1] = operatorLeft.y;
    leftPositions[2] = operatorLeft.z;
    
    leftPositions[3] = bridleConnection.x;
    leftPositions[4] = bridleConnection.y;
    leftPositions[5] = bridleConnection.z;
    
    leftLine.geometry.attributes.position.needsUpdate = true;
    
    // Update right line geometry - connect to bridle connection point
    const rightPositions = rightLine.geometry.attributes.position.array;
    
    rightPositions[0] = operatorRight.x;
    rightPositions[1] = operatorRight.y;
    rightPositions[2] = operatorRight.z;
    
    rightPositions[3] = bridleConnection.x;
    rightPositions[4] = bridleConnection.y;
    rightPositions[5] = bridleConnection.z;
    
    rightLine.geometry.attributes.position.needsUpdate = true;
}

/**
 * Set left line control input
 * @param {number} input - Control input (0-1)
 */
function setLeftInput(input) {
    // Clamp input to valid range
    tetherConfig.leftInput = Math.max(0, Math.min(1, input));
}

/**
 * Set right line control input
 * @param {number} input - Control input (0-1)
 */
function setRightInput(input) {
    // Clamp input to valid range
    tetherConfig.rightInput = Math.max(0, Math.min(1, input));
}

/**
 * Set overall line length adjustment
 * @param {number} adjustment - Length adjustment (-1 to 1)
 */
function setOverallLineLength(adjustment) {
    // Clamp to valid range
    tetherConfig.overallLengthAdjustment = Math.max(-1, Math.min(1, adjustment));
}

/**
 * Set differential line length adjustment
 * @param {number} adjustment - Differential adjustment (-1 to 1)
 */
function setDifferentialLineLength(adjustment) {
    // Clamp to valid range
    tetherConfig.differentialLengthAdjustment = Math.max(-1, Math.min(1, adjustment));
}

/**
 * Get the tether attachment points
 * @returns {Object} The attachment points {left, right}
 */
function getTetherAttachPoints() {
    return {
        left: { ...leftAttachPoint },
        right: { ...rightAttachPoint }
    };
}

/**
 * Get the forces applied by the tethers
 * @returns {Object} Force vector {x, y, z}
 */
function getTetherForces() {
    try {
        // Calculate tension in each line
        const { leftTension, rightTension } = calculateTetherForces();
        
        // Get current kite properties
        const kite = getKiteProperties();
        
        // Validate kite position
        if (isNaN(kite.position.x) || isNaN(kite.position.y) || isNaN(kite.position.z)) {
            console.error('Invalid kite position in getTetherForces:', kite.position);
            return { x: 0, y: 0, z: 0 }; // Return zero force if position is invalid
        }
        
        // Get bridle connection point in world space
        const bridleConnection = {
            x: kite.position.x + kite.bridle.connectionPoint.x,
            y: kite.position.y + kite.bridle.connectionPoint.y,
            z: kite.position.z + kite.bridle.connectionPoint.z
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
        
        // Prevent division by zero
        if (leftMag > 0.0001) {
            leftDir.x /= leftMag;
            leftDir.y /= leftMag;
            leftDir.z /= leftMag;
        } else {
            leftDir.x = 0;
            leftDir.y = 1; // Default to upward direction if magnitude is too small
            leftDir.z = 0;
        }
        
        if (rightMag > 0.0001) {
            rightDir.x /= rightMag;
            rightDir.y /= rightMag;
            rightDir.z /= rightMag;
        } else {
            rightDir.x = 0;
            rightDir.y = 1; // Default to upward direction if magnitude is too small
            rightDir.z = 0;
        }
        
        // Apply smoother force scaling with a non-linear response curve
        // This makes small tensions more gentle while still allowing stronger tensions
        const scaleTension = (tension) => {
            return Math.pow(tension, 0.8) * 5.0; // Reduced overall force by using a smaller multiplier
        };
        
        // Calculate force components (F = tension * direction)
        const leftForce = {
            x: leftDir.x * scaleTension(leftTension),
            y: leftDir.y * scaleTension(leftTension),
            z: leftDir.z * scaleTension(leftTension)
        };
        
        const rightForce = {
            x: rightDir.x * scaleTension(rightTension),
            y: rightDir.y * scaleTension(rightTension),
            z: rightDir.z * scaleTension(rightTension)
        };
        
        // Sum the forces
        const totalForce = {
            x: leftForce.x + rightForce.x,
            y: leftForce.y + rightForce.y,
            z: leftForce.z + rightForce.z
        };
        
        // Validate the final force
        if (isNaN(totalForce.x) || isNaN(totalForce.y) || isNaN(totalForce.z)) {
            console.error('Invalid tether force calculated:', totalForce, 'leftTension:', leftTension, 'rightTension:', rightTension);
            return { x: 0, y: 0, z: 0 }; // Return zero force if calculation resulted in NaN
        }
        
        // Apply a lower maximum force limit to prevent instability
        const maxForce = 20.0;  // Reduced from 50.0
        const forceMagSquared = totalForce.x*totalForce.x + totalForce.y*totalForce.y + totalForce.z*totalForce.z;
        
        if (forceMagSquared > maxForce * maxForce) {
            const forceMag = Math.sqrt(forceMagSquared);
            const scale = maxForce / forceMag;
            totalForce.x *= scale;
            totalForce.y *= scale;
            totalForce.z *= scale;
        }
        
        // Add velocity-based damping to stabilize the kite
        const kiteVelocity = kite.velocity;
        const dampingFactor = 0.8;  // Increased damping
        
        totalForce.x -= kiteVelocity.x * dampingFactor;
        totalForce.y -= kiteVelocity.y * dampingFactor;
        totalForce.z -= kiteVelocity.z * dampingFactor;
        
        return totalForce;
    } catch (error) {
        console.error('Error in getTetherForces:', error);
        return { x: 0, y: 0, z: 0 }; // Return zero force in case of any error
    }
}

/**
 * Get tether configuration
 * @returns {Object} Current tether configuration
 */
function getTetherConfig() {
    return { ...tetherConfig }; // Return a copy to prevent direct modification
}

// Export public functions
export {
    initTethers,
    updateTethers,
    setLeftInput,
    setRightInput,
    setOverallLineLength,
    setDifferentialLineLength,
    getTetherAttachPoints,
    getTetherForces,
    getTetherConfig
};
