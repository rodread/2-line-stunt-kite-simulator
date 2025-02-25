/**
 * Kite Flying Simulator - Kite Model Module
 * 
 * This module handles:
 * - Loading and managing the kite 3D model
 * - Kite properties and parameters
 * - Kite state and movement
 */

import { getScene } from './world.js';
import { getTetherAttachPoints } from './physics/tether.js';

// Module-level variables
let kiteModel = null;
let kiteProperties = {
    // Default kite properties
    mass: 0.5, // kg
    wingspan: 2.0, // meters
    area: 1.2, // square meters
    dragCoefficient: 0.8,
    position: { x: 0, y: 2, z: 0 }, // Initial position
    velocity: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }, // Euler angles
    // Attachment points for tethers (relative to kite center)
    leftAttach: { x: -0.5, y: 0, z: 0 },
    rightAttach: { x: 0.5, y: 0, z: 0 }
};

// Kite types library
const kiteTypes = {
    'standard': {
        name: 'Standard Stunt Kite',
        mass: 0.5,
        wingspan: 2.0,
        area: 1.2,
        dragCoefficient: 0.8,
        scale: 1.0,
        color: 0x00BFFF // Deep Sky Blue
    },
    'delta': {
        name: 'Delta Kite',
        mass: 0.4,
        wingspan: 1.8,
        area: 1.0,
        dragCoefficient: 0.7,
        scale: 0.9,
        color: 0xFF6347 // Tomato
    },
    'precision': {
        name: 'Precision Stunt Kite',
        mass: 0.6,
        wingspan: 2.2,
        area: 1.5,
        dragCoefficient: 0.9,
        scale: 1.1,
        color: 0x9932CC // Dark Orchid
    }
};

// Current kite type
let currentKiteType = 'standard';

/**
 * Load the kite 3D model
 * @returns {Promise} Resolves when the kite model is loaded
 */
function loadKiteModel() {
    return new Promise((resolve, reject) => {
        const scene = getScene();
        const objLoader = new THREE.OBJLoader();
        
        objLoader.load(
            'kite.obj', // Model path
            (object) => {
                kiteModel = object;
                
                // Apply material to the kite model
                object.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        // Apply material based on current kite type
                        child.material = new THREE.MeshStandardMaterial({
                            color: kiteTypes[currentKiteType].color,
                            roughness: 0.5,
                            metalness: 0.2,
                            side: THREE.DoubleSide
                        });
                    }
                });
                
                // Scale the model appropriately
                const scale = kiteTypes[currentKiteType].scale * 0.5;
                kiteModel.scale.set(scale, scale, scale);
                
                // Set initial position
                kiteModel.position.set(
                    kiteProperties.position.x,
                    kiteProperties.position.y,
                    kiteProperties.position.z
                );
                
                // Initial rotation (60-degree elevation as per project plan)
                kiteModel.rotation.x = -Math.PI / 3; // -60 degrees (point upward)
                
                // Add the kite to the scene
                scene.add(kiteModel);
                
                resolve(kiteModel);
            },
            // Progress callback
            (xhr) => {
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                console.log(`Kite model loading: ${percentComplete.toFixed(1)}%`);
            },
            // Error callback
            (error) => {
                console.error('Error loading kite model:', error);
                reject(error);
            }
        );
    });
}

/**
 * Update kite position and orientation based on physics
 * @param {number} deltaTime - Time since last frame in seconds
 */
function updateKitePosition(deltaTime) {
    if (!kiteModel) return;
    
    // TODO: Stage 2 - Implement physics-based movement
    // For now, just set the position directly from kiteProperties
    kiteModel.position.set(
        kiteProperties.position.x,
        kiteProperties.position.y,
        kiteProperties.position.z
    );
    
    // TODO: Stage 2 - Update rotation based on physics
    kiteModel.rotation.set(
        kiteProperties.rotation.x,
        kiteProperties.rotation.y,
        kiteProperties.rotation.z
    );
}

/**
 * Change the kite type
 * @param {string} kiteType - The kite type ID ('standard', 'delta', 'precision')
 */
function changeKiteType(kiteType) {
    if (!kiteTypes[kiteType]) {
        console.error(`Unknown kite type: ${kiteType}`);
        return;
    }
    
    // Update current kite type
    currentKiteType = kiteType;
    
    // Update kite properties based on the new type
    kiteProperties.mass = kiteTypes[kiteType].mass;
    kiteProperties.wingspan = kiteTypes[kiteType].wingspan;
    kiteProperties.area = kiteTypes[kiteType].area;
    kiteProperties.dragCoefficient = kiteTypes[kiteType].dragCoefficient;
    
    // Update the model if it's loaded
    if (kiteModel) {
        // Update material color
        kiteModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material.color.setHex(kiteTypes[kiteType].color);
            }
        });
        
        // Update scale
        const scale = kiteTypes[kiteType].scale * 0.5;
        kiteModel.scale.set(scale, scale, scale);
    }
    
    // TODO: Stage 5 - Implement different flight characteristics
}

/**
 * Reset kite to starting position
 */
function resetKite() {
    kiteProperties.position = { x: 0, y: 2, z: 0 };
    kiteProperties.velocity = { x: 0, y: 0, z: 0 };
    kiteProperties.rotation = { x: -Math.PI / 3, y: 0, z: 0 };
    
    if (kiteModel) {
        kiteModel.position.set(
            kiteProperties.position.x,
            kiteProperties.position.y,
            kiteProperties.position.z
        );
        
        kiteModel.rotation.set(
            kiteProperties.rotation.x,
            kiteProperties.rotation.y,
            kiteProperties.rotation.z
        );
    }
}

/**
 * Apply a force to the kite
 * @param {Object} force - The force vector {x, y, z}
 */
function applyForce(force) {
    // TODO: Stage 2 - Implement force application based on physics
    
    // Simple Euler integration for now (to be replaced with proper physics)
    const acceleration = {
        x: force.x / kiteProperties.mass,
        y: force.y / kiteProperties.mass,
        z: force.z / kiteProperties.mass
    };
    
    // Update velocity
    kiteProperties.velocity.x += acceleration.x;
    kiteProperties.velocity.y += acceleration.y;
    kiteProperties.velocity.z += acceleration.z;
    
    // Update position
    kiteProperties.position.x += kiteProperties.velocity.x;
    kiteProperties.position.y += kiteProperties.velocity.y;
    kiteProperties.position.z += kiteProperties.velocity.z;
}

/**
 * Get kite properties
 * @returns {Object} The current kite properties
 */
function getKiteProperties() {
    return { ...kiteProperties }; // Return a copy to prevent direct modification
}

/**
 * Get kite position
 * @returns {Object} The current kite position {x, y, z}
 */
function getKitePosition() {
    return { ...kiteProperties.position };
}

/**
 * Get kite rotation
 * @returns {Object} The current kite rotation {x, y, z} (Euler angles)
 */
function getKiteRotation() {
    return { ...kiteProperties.rotation };
}

/**
 * Get kite velocity
 * @returns {Object} The current kite velocity {x, y, z}
 */
function getKiteVelocity() {
    return { ...kiteProperties.velocity };
}

/**
 * Get available kite types
 * @returns {Object} A map of available kite types
 */
function getKiteTypes() {
    return kiteTypes;
}

// Export public functions
export {
    loadKiteModel,
    updateKitePosition,
    changeKiteType,
    resetKite,
    applyForce,
    getKiteProperties,
    getKitePosition,
    getKiteRotation,
    getKiteVelocity,
    getKiteTypes
};
