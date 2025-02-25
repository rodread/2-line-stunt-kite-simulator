/**
 * Kite Flying Simulator - Tether System
 * 
 * This module handles the kite lines (tethers), including:
 * - Line physics (tension, elasticity)
 * - Line visualization
 * - Line input and manipulation
 */

import { getScene } from '../world.js';
import { getKitePosition } from '../kite.js';

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
    
    // Create left line
    const leftMaterial = new THREE.LineBasicMaterial({ 
        color: 0xFFFFFF, // White
        linewidth: 1 // Note: linewidth may not work on all platforms due to WebGL limitations
    });
    
    const leftGeometry = new THREE.BufferGeometry();
    // Initial positions will be updated in updateTethers()
    const leftPositions = new Float32Array(6); // Two points (xyz, xyz)
    leftGeometry.setAttribute('position', new THREE.BufferAttribute(leftPositions, 3));
    
    leftLine = new THREE.Line(leftGeometry, leftMaterial);
    scene.add(leftLine);
    
    // Create right line
    const rightMaterial = new THREE.LineBasicMaterial({ 
        color: 0xFFFFFF, // White
        linewidth: 1
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
    // Get current kite position
    const kitePos = getKitePosition();
    
    // Calculate positions of the kite attachment points in world space
    // (For now a simplification - this should be updated based on kite rotation)
    const leftAttach = {
        x: kitePos.x + leftAttachPoint.x,
        y: kitePos.y + leftAttachPoint.y,
        z: kitePos.z + leftAttachPoint.z
    };
    
    const rightAttach = {
        x: kitePos.x + rightAttachPoint.x,
        y: kitePos.y + rightAttachPoint.y,
        z: kitePos.z + rightAttachPoint.z
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
    const leftTension = calculateLineTension(leftDistance, tetherConfig.leftLineLength, tetherConfig.leftInput);
    const rightTension = calculateLineTension(rightDistance, tetherConfig.rightLineLength, tetherConfig.rightInput);
    
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
    
    // Get current kite position
    const kitePos = getKitePosition();
    
    // Calculate positions of the kite attachment points in world space
    const leftAttach = {
        x: kitePos.x + leftAttachPoint.x,
        y: kitePos.y + leftAttachPoint.y,
        z: kitePos.z + leftAttachPoint.z
    };
    
    const rightAttach = {
        x: kitePos.x + rightAttachPoint.x,
        y: kitePos.y + rightAttachPoint.y,
        z: kitePos.z + rightAttachPoint.z
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
    
    // Update left line geometry
    const leftPositions = leftLine.geometry.attributes.position.array;
    
    leftPositions[0] = operatorLeft.x;
    leftPositions[1] = operatorLeft.y;
    leftPositions[2] = operatorLeft.z;
    
    leftPositions[3] = leftAttach.x;
    leftPositions[4] = leftAttach.y;
    leftPositions[5] = leftAttach.z;
    
    leftLine.geometry.attributes.position.needsUpdate = true;
    
    // Update right line geometry
    const rightPositions = rightLine.geometry.attributes.position.array;
    
    rightPositions[0] = operatorRight.x;
    rightPositions[1] = operatorRight.y;
    rightPositions[2] = operatorRight.z;
    
    rightPositions[3] = rightAttach.x;
    rightPositions[4] = rightAttach.y;
    rightPositions[5] = rightAttach.z;
    
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
    // TODO: Stage 2 - Implement proper force calculations
    
    // Placeholder for now - this will need to be properly implemented
    // during Stage 2 of development
    
    // Calculate tension in each line
    const { leftTension, rightTension } = calculateTetherForces();
    
    // Get current kite position
    const kitePos = getKitePosition();
    
    // Calculate positions of the attachment points in world space
    const leftAttach = {
        x: kitePos.x + leftAttachPoint.x,
        y: kitePos.y + leftAttachPoint.y,
        z: kitePos.z + leftAttachPoint.z
    };
    
    const rightAttach = {
        x: kitePos.x + rightAttachPoint.x,
        y: kitePos.y + rightAttachPoint.y,
        z: kitePos.z + rightAttachPoint.z
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
    
    // Calculate force components (F = tension * direction)
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
    
    // Sum the forces
    return {
        x: leftForce.x + rightForce.x,
        y: leftForce.y + rightForce.y,
        z: leftForce.z + rightForce.z
    };
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
