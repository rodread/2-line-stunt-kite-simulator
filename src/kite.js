/**
 * Kite Flying Simulator - Kite Model Module
 * 
 * This module handles:
 * - Loading and managing the kite 3D model
 * - Kite properties and parameters
 * - Kite state and movement
 */

import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
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
    angularVelocity: { x: 0, y: 0, z: 0 }, // Angular velocity (rad/s)
    
    // Moment of inertia (simplified as diagonal matrix)
    // For a rectangular plate: Ix = m/12 * (h² + d²), etc.
    momentOfInertia: {
        x: 0.1, // Around x-axis (roll)
        y: 0.2, // Around y-axis (yaw)
        z: 0.15  // Around z-axis (pitch)
    },
    
    // Attachment points for tethers (relative to kite center)
    leftAttach: { x: -0.5, y: 0, z: 0 },
    rightAttach: { x: 0.5, y: 0, z: 0 },
    
    // Bridle system
    bridle: {
        // Bridle attachment points (relative to kite center)
        topAttach: { x: 0, y: 0.3, z: -0.2 },
        bottomAttach: { x: 0, y: -0.2, z: -0.8 },
        leftAttach: { x: -0.8, y: 0, z: -0.4 },
        rightAttach: { x: 0.8, y: 0, z: -0.4 },
        
        // Bridle connection point (where tethers connect to bridle)
        connectionPoint: { x: 0, y: 0, z: 0.5 },
        
        // Bridle length adjustment (affects angle of attack)
        lengthAdjustment: 0.0, // -1 to 1 (negative: more AoA, positive: less AoA)
        
        // Bridle tension
        tension: 0.0
    }
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
 * Create a simple kite geometry based on kite type
 * @param {string} type - The kite type
 * @returns {THREE.Group} The kite group containing the geometry
 */
function createKiteGeometry(type) {
    const kiteGroup = new THREE.Group();
    const kiteConfig = kiteTypes[type];
    const color = kiteConfig.color;
    
    // Create bridle visualization
    createBridleVisualization(kiteGroup);
    
    // Create different geometry based on kite type
    if (type === 'delta') {
        // Delta kite - triangular shape
        const wingGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0,       // nose
            -1.0, -0.2, -0.5,  // left wing tip
            1.0, -0.2, -0.5,   // right wing tip
            0, -0.4, -1.0   // tail
        ]);
        
        const indices = [
            0, 1, 2, // front face
            1, 3, 2  // back face
        ];
        
        wingGeometry.setIndex(indices);
        wingGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        wingGeometry.computeVertexNormals();
        
        // Create a brighter, more visible material for the kite
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3, // Lower roughness for more shine
            metalness: 0.4, // Higher metalness for more reflectivity
            emissive: color, // Add emissive color to make it glow slightly
            emissiveIntensity: 0.3, // Moderate glow
            side: THREE.DoubleSide
        });
        
        const kiteMesh = new THREE.Mesh(wingGeometry, wingMaterial);
        kiteGroup.add(kiteMesh);
        
        // Add a spine for structural detail
        const spineGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
        const spineMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        const spine = new THREE.Mesh(spineGeometry, spineMaterial);
        spine.rotation.x = Math.PI / 2;
        spine.position.z = -0.5;
        spine.position.y = -0.2;
        kiteGroup.add(spine);
        
    } else if (type === 'precision') {
        // Precision stunt kite - more rectangular with curved edges
        const wingGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0,       // nose
            -1.2, 0, -0.3,  // left wing front
            -1.0, -0.1, -0.8,  // left wing back
            1.2, 0, -0.3,   // right wing front
            1.0, -0.1, -0.8,   // right wing back
            0, -0.2, -1.0   // tail
        ]);
        
        const indices = [
            0, 1, 3, // front center
            1, 2, 5, // left wing
            3, 4, 5, // right wing
            1, 5, 3  // back center
        ];
        
        wingGeometry.setIndex(indices);
        wingGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        wingGeometry.computeVertexNormals();
        
        // Create a brighter, more visible material for the kite
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3, // Lower roughness for more shine
            metalness: 0.4, // Higher metalness for more reflectivity
            emissive: color, // Add emissive color to make it glow slightly
            emissiveIntensity: 0.3, // Moderate glow
            side: THREE.DoubleSide
        });
        
        const kiteMesh = new THREE.Mesh(wingGeometry, wingMaterial);
        kiteGroup.add(kiteMesh);
        
        // Add cross-spars for detail
        const sparGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2.4, 8);
        const sparMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        const spar = new THREE.Mesh(sparGeometry, sparMaterial);
        spar.rotation.x = Math.PI / 2;
        spar.rotation.z = Math.PI / 2;
        spar.position.z = -0.3;
        kiteGroup.add(spar);
        
    } else {
        // Standard stunt kite - default
        const wingGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0,       // nose
            -1.0, 0, -0.5,  // left wing tip
            1.0, 0, -0.5,   // right wing tip
            0, -0.1, -1.0   // tail
        ]);
        
        const indices = [
            0, 1, 2, // front face
            1, 3, 2  // back face
        ];
        
        wingGeometry.setIndex(indices);
        wingGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        wingGeometry.computeVertexNormals();
        
        // Create a brighter, more visible material for the kite
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3, // Lower roughness for more shine
            metalness: 0.4, // Higher metalness for more reflectivity
            emissive: color, // Add emissive color to make it glow slightly
            emissiveIntensity: 0.3, // Moderate glow
            side: THREE.DoubleSide
        });
        
        const kiteMesh = new THREE.Mesh(wingGeometry, wingMaterial);
        kiteGroup.add(kiteMesh);
        
        // Add a simple frame for detail
        const frameGeometry = new THREE.BufferGeometry();
        const frameVertices = new Float32Array([
            0, 0, 0,       // nose
            -1.0, 0, -0.5,  // left wing tip
            1.0, 0, -0.5,   // right wing tip
            0, -0.1, -1.0   // tail
        ]);
        
        const frameIndices = [
            0, 1, 0, 2, 0, 3, 1, 3, 2, 3
        ];
        
        frameGeometry.setIndex(frameIndices);
        frameGeometry.setAttribute('position', new THREE.BufferAttribute(frameVertices, 3));
        
        const frameMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
        kiteGroup.add(frame);
    }
    
    // Add attachment points for tethers
    const leftAttachGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const rightAttachGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const attachMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const leftAttach = new THREE.Mesh(leftAttachGeometry, attachMaterial);
    leftAttach.position.set(-0.5, 0, 0);
    
    const rightAttach = new THREE.Mesh(rightAttachGeometry, attachMaterial);
    rightAttach.position.set(0.5, 0, 0);
    
    kiteGroup.add(leftAttach);
    kiteGroup.add(rightAttach);
    
    return kiteGroup;
}

/**
 * Load the kite 3D model
 * @returns {Promise} Resolves when the kite model is loaded
 */
function loadKiteModel() {
    return new Promise((resolve) => {
        console.log('Creating kite model...');
        const scene = getScene();
        
        // Create a kite geometry based on the current type
        kiteModel = createKiteGeometry(currentKiteType);
        
        // Calculate initial position based on tether length and pilot position
        // Pilot is at (0, 0, -10), tether length is 30m
        // Position the kite at the end of the tether at a 30-degree angle from horizontal
        const tetherLength = 30.0; // Match this with the tether configuration
        const elevationAngle = Math.PI / 6; // 30 degrees in radians
        
        // Calculate position using spherical coordinates
        // x = 0 (directly in front of pilot)
        // y = sin(elevation) * tetherLength
        // z = -10 (pilot z) - cos(elevation) * tetherLength (negative to position in front of pilot)
        kiteProperties.position = {
            x: 0,
            y: Math.sin(elevationAngle) * tetherLength, // Height based on elevation angle
            z: -10 - Math.cos(elevationAngle) * tetherLength // Distance in front of pilot (negative z is forward)
        };
        
        kiteModel.position.set(
            kiteProperties.position.x,
            kiteProperties.position.y,
            kiteProperties.position.z
        );
        
        // Set initial rotation to match the elevation angle
        // The kite should be angled to have a proper angle of attack relative to the wind
        kiteModel.rotation.x = -(Math.PI / 2 - elevationAngle); // Angle kite to face into the wind
        
        // Make the kite larger for better visibility
        const scale = kiteTypes[currentKiteType].scale * 3.0; // Increased scale even more for better visibility
        kiteModel.scale.set(scale, scale, scale);
        
        // Add a highlight effect to make the kite more visible
        const kiteHighlight = new THREE.PointLight(0xffffff, 0.5, 10);
        kiteHighlight.position.set(0, 0, 0); // Position at the center of the kite
        kiteModel.add(kiteHighlight); // Add the light to the kite model so it moves with it
        
        // Add the kite to the scene
        scene.add(kiteModel);
        
        // Simulate loading progress for UI consistency
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            console.log(`Kite model loading: ${progress}%`);
            if (progress >= 100) {
                clearInterval(interval);
                resolve(kiteModel);
            }
        }, 100);
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
        // Store current position and rotation
        const position = kiteModel.position.clone();
        const rotation = new THREE.Euler().copy(kiteModel.rotation);
        
        // Remove old model from scene
        const scene = getScene();
        scene.remove(kiteModel);
        
        // Create new kite geometry based on the new type
        kiteModel = createKiteGeometry(kiteType);
        
        // Apply scale
        const scale = kiteTypes[kiteType].scale * 0.5;
        kiteModel.scale.set(scale, scale, scale);
        
        // Restore position and rotation
        kiteModel.position.copy(position);
        kiteModel.rotation.copy(rotation);
        
        // Add to scene
        scene.add(kiteModel);
    }
    
    // TODO: Stage 5 - Implement different flight characteristics
}

/**
 * Create visualization for the bridle system
 * @param {THREE.Group} kiteGroup - The kite group to add bridle to
 */
function createBridleVisualization(kiteGroup) {
    const bridleMaterial = new THREE.LineBasicMaterial({ 
        color: 0x888888, 
        linewidth: 1,
        transparent: true,
        opacity: 0.7
    });
    
    // Create bridle attachment points
    const attachGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const attachMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    
    // Top attachment point
    const topAttach = new THREE.Mesh(attachGeometry, attachMaterial);
    topAttach.position.set(
        kiteProperties.bridle.topAttach.x,
        kiteProperties.bridle.topAttach.y,
        kiteProperties.bridle.topAttach.z
    );
    kiteGroup.add(topAttach);
    
    // Bottom attachment point
    const bottomAttach = new THREE.Mesh(attachGeometry, attachMaterial);
    bottomAttach.position.set(
        kiteProperties.bridle.bottomAttach.x,
        kiteProperties.bridle.bottomAttach.y,
        kiteProperties.bridle.bottomAttach.z
    );
    kiteGroup.add(bottomAttach);
    
    // Left attachment point
    const leftAttach = new THREE.Mesh(attachGeometry, attachMaterial);
    leftAttach.position.set(
        kiteProperties.bridle.leftAttach.x,
        kiteProperties.bridle.leftAttach.y,
        kiteProperties.bridle.leftAttach.z
    );
    kiteGroup.add(leftAttach);
    
    // Right attachment point
    const rightAttach = new THREE.Mesh(attachGeometry, attachMaterial);
    rightAttach.position.set(
        kiteProperties.bridle.rightAttach.x,
        kiteProperties.bridle.rightAttach.y,
        kiteProperties.bridle.rightAttach.z
    );
    kiteGroup.add(rightAttach);
    
    // Bridle connection point
    const connectionGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const connectionMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const connectionPoint = new THREE.Mesh(connectionGeometry, connectionMaterial);
    connectionPoint.position.set(
        kiteProperties.bridle.connectionPoint.x,
        kiteProperties.bridle.connectionPoint.y,
        kiteProperties.bridle.connectionPoint.z
    );
    kiteGroup.add(connectionPoint);
    
    // Create bridle lines
    // Top to connection
    const topLine = new THREE.BufferGeometry();
    const topVertices = new Float32Array([
        kiteProperties.bridle.topAttach.x, kiteProperties.bridle.topAttach.y, kiteProperties.bridle.topAttach.z,
        kiteProperties.bridle.connectionPoint.x, kiteProperties.bridle.connectionPoint.y, kiteProperties.bridle.connectionPoint.z
    ]);
    topLine.setAttribute('position', new THREE.BufferAttribute(topVertices, 3));
    kiteGroup.add(new THREE.Line(topLine, bridleMaterial));
    
    // Bottom to connection
    const bottomLine = new THREE.BufferGeometry();
    const bottomVertices = new Float32Array([
        kiteProperties.bridle.bottomAttach.x, kiteProperties.bridle.bottomAttach.y, kiteProperties.bridle.bottomAttach.z,
        kiteProperties.bridle.connectionPoint.x, kiteProperties.bridle.connectionPoint.y, kiteProperties.bridle.connectionPoint.z
    ]);
    bottomLine.setAttribute('position', new THREE.BufferAttribute(bottomVertices, 3));
    kiteGroup.add(new THREE.Line(bottomLine, bridleMaterial));
    
    // Left to connection
    const leftLine = new THREE.BufferGeometry();
    const leftVertices = new Float32Array([
        kiteProperties.bridle.leftAttach.x, kiteProperties.bridle.leftAttach.y, kiteProperties.bridle.leftAttach.z,
        kiteProperties.bridle.connectionPoint.x, kiteProperties.bridle.connectionPoint.y, kiteProperties.bridle.connectionPoint.z
    ]);
    leftLine.setAttribute('position', new THREE.BufferAttribute(leftVertices, 3));
    kiteGroup.add(new THREE.Line(leftLine, bridleMaterial));
    
    // Right to connection
    const rightLine = new THREE.BufferGeometry();
    const rightVertices = new Float32Array([
        kiteProperties.bridle.rightAttach.x, kiteProperties.bridle.rightAttach.y, kiteProperties.bridle.rightAttach.z,
        kiteProperties.bridle.connectionPoint.x, kiteProperties.bridle.connectionPoint.y, kiteProperties.bridle.connectionPoint.z
    ]);
    rightLine.setAttribute('position', new THREE.BufferAttribute(rightVertices, 3));
    kiteGroup.add(new THREE.Line(rightLine, bridleMaterial));
}

/**
 * Apply torque to the kite
 * @param {Object} torque - The torque vector {x, y, z}
 */
function applyTorque(torque) {
    // Validate torque values to prevent NaN
    if (isNaN(torque.x) || isNaN(torque.y) || isNaN(torque.z)) {
        console.error('Invalid torque values:', torque);
        return; // Skip this update if torque contains NaN
    }
    
    // Apply smoothing to torque similar to force
    // Use exponential moving average with a small alpha for stability
    const alpha = 0.1; // Even lower alpha for angular motion
    
    // Store current angular acceleration for smoothing
    if (!kiteProperties.smoothedAngularAcceleration) {
        kiteProperties.smoothedAngularAcceleration = { x: 0, y: 0, z: 0 };
    }
    
    // Calculate raw angular acceleration (τ = I * α)
    const rawAngularAcceleration = {
        x: torque.x / kiteProperties.momentOfInertia.x,
        y: torque.y / kiteProperties.momentOfInertia.y,
        z: torque.z / kiteProperties.momentOfInertia.z
    };
    
    // Apply exponential smoothing
    kiteProperties.smoothedAngularAcceleration.x = alpha * rawAngularAcceleration.x + (1 - alpha) * kiteProperties.smoothedAngularAcceleration.x;
    kiteProperties.smoothedAngularAcceleration.y = alpha * rawAngularAcceleration.y + (1 - alpha) * kiteProperties.smoothedAngularAcceleration.y;
    kiteProperties.smoothedAngularAcceleration.z = alpha * rawAngularAcceleration.z + (1 - alpha) * kiteProperties.smoothedAngularAcceleration.z;
    
    // Update angular velocity
    kiteProperties.angularVelocity.x += kiteProperties.smoothedAngularAcceleration.x;
    kiteProperties.angularVelocity.y += kiteProperties.smoothedAngularAcceleration.y;
    kiteProperties.angularVelocity.z += kiteProperties.smoothedAngularAcceleration.z;
    
    // Apply stronger angular damping to prevent wobble
    const angularDampingFactor = 0.08; // Increase for more damping
    kiteProperties.angularVelocity.x *= (1 - angularDampingFactor);
    kiteProperties.angularVelocity.y *= (1 - angularDampingFactor);
    kiteProperties.angularVelocity.z *= (1 - angularDampingFactor);
    
    // Apply angular velocity limits (reduced from 5.0)
    const maxAngularVelocity = 2.0; // Lower maximum angular velocity
    const angularVelocityMagSquared = 
        kiteProperties.angularVelocity.x * kiteProperties.angularVelocity.x + 
        kiteProperties.angularVelocity.y * kiteProperties.angularVelocity.y + 
        kiteProperties.angularVelocity.z * kiteProperties.angularVelocity.z;
    
    if (angularVelocityMagSquared > maxAngularVelocity * maxAngularVelocity) {
        const angularVelocityMag = Math.sqrt(angularVelocityMagSquared);
        const scale = maxAngularVelocity / angularVelocityMag;
        kiteProperties.angularVelocity.x *= scale;
        kiteProperties.angularVelocity.y *= scale;
        kiteProperties.angularVelocity.z *= scale;
    }
    
    // Update rotation (Euler angles) with smoothed angular velocity
    kiteProperties.rotation.x += kiteProperties.angularVelocity.x;
    kiteProperties.rotation.y += kiteProperties.angularVelocity.y;
    kiteProperties.rotation.z += kiteProperties.angularVelocity.z;
    
    // Validate rotation values
    if (isNaN(kiteProperties.rotation.x) || isNaN(kiteProperties.rotation.y) || isNaN(kiteProperties.rotation.z)) {
        console.error('Invalid rotation values:', kiteProperties.rotation);
        resetKite(); // Reset the kite if rotation contains NaN
    }
}

/**
 * Reset kite to starting position
 */
function resetKite() {
    console.log('Resetting kite position');
    
    // Calculate initial position based on tether length and pilot position
    // Pilot is at (0, 0, -10), tether length is 30m
    // Position the kite at the end of the tether at a 30-degree angle from horizontal
    const tetherLength = 30.0; // Match this with the tether configuration
    const elevationAngle = Math.PI / 6; // 30 degrees in radians
    
    // Calculate position using spherical coordinates
    kiteProperties.position = {
        x: 0,
        y: Math.sin(elevationAngle) * tetherLength, // Height based on elevation angle
        z: -10 - Math.cos(elevationAngle) * tetherLength // Distance in front of pilot (negative z is forward)
    };
    
    kiteProperties.velocity = { x: 0, y: 0, z: 0 };
    kiteProperties.rotation = { x: -(Math.PI / 2 - elevationAngle), y: 0, z: 0 };
    kiteProperties.angularVelocity = { x: 0, y: 0, z: 0 };
    
    // Update the 3D model if it exists
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
    // Validate force values to prevent NaN
    if (isNaN(force.x) || isNaN(force.y) || isNaN(force.z)) {
        console.error('Invalid force values:', force);
        return; // Skip this update if force contains NaN
    }
    
    // Apply smoothing to force to reduce jerky movements
    // Use exponential moving average with a small alpha for stability
    const alpha = 0.15; // Lower alpha means more smoothing
    
    // Store current acceleration for smoothing
    if (!kiteProperties.smoothedAcceleration) {
        kiteProperties.smoothedAcceleration = { x: 0, y: 0, z: 0 };
    }
    
    // Calculate raw acceleration (F = ma, so a = F/m)
    const rawAcceleration = {
        x: force.x / kiteProperties.mass,
        y: force.y / kiteProperties.mass,
        z: force.z / kiteProperties.mass
    };
    
    // Apply exponential smoothing
    kiteProperties.smoothedAcceleration.x = alpha * rawAcceleration.x + (1 - alpha) * kiteProperties.smoothedAcceleration.x;
    kiteProperties.smoothedAcceleration.y = alpha * rawAcceleration.y + (1 - alpha) * kiteProperties.smoothedAcceleration.y;
    kiteProperties.smoothedAcceleration.z = alpha * rawAcceleration.z + (1 - alpha) * kiteProperties.smoothedAcceleration.z;
    
    // Update velocity with smoothed acceleration
    kiteProperties.velocity.x += kiteProperties.smoothedAcceleration.x;
    kiteProperties.velocity.y += kiteProperties.smoothedAcceleration.y;
    kiteProperties.velocity.z += kiteProperties.smoothedAcceleration.z;
    
    // Apply stronger velocity damping to prevent oscillations
    const dampingFactor = 0.05; // Increase this value for more damping
    kiteProperties.velocity.x *= (1 - dampingFactor);
    kiteProperties.velocity.y *= (1 - dampingFactor);
    kiteProperties.velocity.z *= (1 - dampingFactor);
    
    // Apply velocity limits to prevent instability (reduced from 10.0)
    const maxVelocity = 5.0; // Lower maximum velocity for stability
    const velocityMagSquared = 
        kiteProperties.velocity.x * kiteProperties.velocity.x + 
        kiteProperties.velocity.y * kiteProperties.velocity.y + 
        kiteProperties.velocity.z * kiteProperties.velocity.z;
    
    if (velocityMagSquared > maxVelocity * maxVelocity) {
        const velocityMag = Math.sqrt(velocityMagSquared);
        const scale = maxVelocity / velocityMag;
        kiteProperties.velocity.x *= scale;
        kiteProperties.velocity.y *= scale;
        kiteProperties.velocity.z *= scale;
    }
    
    // Update position with smoothed velocity
    kiteProperties.position.x += kiteProperties.velocity.x;
    kiteProperties.position.y += kiteProperties.velocity.y;
    kiteProperties.position.z += kiteProperties.velocity.z;
    
    // Validate position values
    if (isNaN(kiteProperties.position.x) || isNaN(kiteProperties.position.y) || isNaN(kiteProperties.position.z)) {
        console.error('Invalid position values:', kiteProperties.position);
        resetKite(); // Reset the kite if position contains NaN
    }
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
    applyTorque,
    getKiteProperties,
    getKitePosition,
    getKiteRotation,
    getKiteVelocity,
    getKiteTypes
};
