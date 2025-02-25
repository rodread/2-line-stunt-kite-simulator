/**
 * Kite Flying Simulator - Telemetry Module
 * 
 * This module handles the display of flight data, including:
 * - Wind speed and direction
 * - Kite speed and position
 * - Angle of attack
 * - Loop counters
 * - Other flight metrics
 */

import { getKitePosition, getKiteRotation, getKiteVelocity } from './kite.js';
import { getWindSpeed, getWindDirection } from './physics/wind.js';
import { getTetherConfig } from './physics/tether.js';

// Telemetry state
const telemetryState = {
    // Flight data
    kiteSpeed: 0, // m/s
    angleOfAttack: 0, // degrees
    loopsCW: 0, // Clockwise loops
    loopsCCW: 0, // Counter-clockwise loops
    flightTime: 0, // seconds
    
    // Rotation tracking for loop counting
    lastRotation: { x: 0, y: 0, z: 0 },
    rotationAccumulator: 0, // Accumulated rotation in radians
    
    // Update frequency control
    updateInterval: 100, // ms
    lastUpdateTime: 0
};

/**
 * Initialize telemetry system
 */
function initTelemetry() {
    console.log('Initializing telemetry...');
    
    // Reset counters
    resetTelemetryCounters();
    
    // Initialize telemetry display
    updateTelemetryDisplay();
    
    // TODO: Stage 4 - Add more telemetry initialization
}

/**
 * Reset telemetry counters
 */
function resetTelemetryCounters() {
    telemetryState.loopsCW = 0;
    telemetryState.loopsCCW = 0;
    telemetryState.flightTime = 0;
    telemetryState.rotationAccumulator = 0;
}

/**
 * Update telemetry data
 * Called every frame
 */
function updateTelemetry() {
    // Get current time
    const currentTime = performance.now();
    
    // Update flight time
    telemetryState.flightTime += 1/60; // Approximate frame time in seconds
    
    // Don't update the display every frame for performance
    if (currentTime - telemetryState.lastUpdateTime < telemetryState.updateInterval) {
        return;
    }
    
    // Update last update time
    telemetryState.lastUpdateTime = currentTime;
    
    // Get current kite state
    const kitePosition = getKitePosition();
    const kiteRotation = getKiteRotation();
    const kiteVelocity = getKiteVelocity();
    
    // Calculate kite speed
    telemetryState.kiteSpeed = calculateKiteSpeed(kiteVelocity);
    
    // Calculate angle of attack
    telemetryState.angleOfAttack = calculateAngleOfAttack(kiteRotation, getWindDirection());
    
    // Track loops
    trackLoops(kiteRotation);
    
    // Update the telemetry display
    updateTelemetryDisplay();
}

/**
 * Calculate kite speed from velocity
 * @param {Object} velocity - Velocity vector {x, y, z}
 * @returns {number} Speed in m/s
 */
function calculateKiteSpeed(velocity) {
    // Calculate magnitude of velocity vector
    return Math.sqrt(
        velocity.x * velocity.x +
        velocity.y * velocity.y +
        velocity.z * velocity.z
    );
}

/**
 * Calculate angle of attack
 * @param {Object} rotation - Kite rotation {x, y, z} (Euler angles)
 * @param {Object} windDirection - Wind direction vector {x, y, z}
 * @returns {number} Angle of attack in degrees
 */
function calculateAngleOfAttack(rotation, windDirection) {
    // TODO: Stage 4 - Implement proper angle of attack calculation
    
    // Simplified calculation for now
    // This is just a placeholder until more sophisticated calculations are implemented
    const kiteNormal = {
        x: 0,
        y: Math.sin(rotation.x),
        z: Math.cos(rotation.x)
    };
    
    // Calculate dot product
    const dotProduct = 
        kiteNormal.x * windDirection.x +
        kiteNormal.y * windDirection.y +
        kiteNormal.z * windDirection.z;
    
    // Calculate magnitudes
    const kiteNormalMag = Math.sqrt(
        kiteNormal.x * kiteNormal.x +
        kiteNormal.y * kiteNormal.y +
        kiteNormal.z * kiteNormal.z
    );
    
    const windMag = Math.sqrt(
        windDirection.x * windDirection.x +
        windDirection.y * windDirection.y +
        windDirection.z * windDirection.z
    );
    
    // Calculate angle
    const angle = Math.acos(dotProduct / (kiteNormalMag * windMag));
    
    // Convert to degrees
    return angle * (180 / Math.PI);
}

/**
 * Track loops (rotations) of the kite
 * @param {Object} rotation - Current kite rotation {x, y, z} (Euler angles)
 */
function trackLoops(rotation) {
    // TODO: Stage 4 - Implement more accurate loop tracking
    
    // Simplified rotation tracking for now
    // This is just a placeholder until more sophisticated loop tracking is implemented
    
    // Calculate rotation delta around z-axis (assuming z is the principal rotation axis for loops)
    let rotationDelta = rotation.z - telemetryState.lastRotation.z;
    
    // Handle wraparound (e.g., going from 359° to 0°)
    if (rotationDelta > Math.PI) {
        rotationDelta -= 2 * Math.PI;
    } else if (rotationDelta < -Math.PI) {
        rotationDelta += 2 * Math.PI;
    }
    
    // Accumulate rotation
    telemetryState.rotationAccumulator += rotationDelta;
    
    // Check for complete loops (2π radians)
    if (telemetryState.rotationAccumulator >= 2 * Math.PI) {
        telemetryState.loopsCW += 1;
        telemetryState.rotationAccumulator -= 2 * Math.PI;
    } else if (telemetryState.rotationAccumulator <= -2 * Math.PI) {
        telemetryState.loopsCCW += 1;
        telemetryState.rotationAccumulator += 2 * Math.PI;
    }
    
    // Update last rotation
    telemetryState.lastRotation = { ...rotation };
}

/**
 * Update the telemetry display in the UI
 */
function updateTelemetryDisplay() {
    // Update wind speed display
    const windSpeedElement = document.getElementById('wind-speed');
    if (windSpeedElement) {
        const windSpeed = getWindSpeed();
        windSpeedElement.textContent = `${(windSpeed * 2.23694).toFixed(1)} mph`; // Convert m/s to mph
    }
    
    // Update kite speed display
    const kiteSpeedElement = document.getElementById('kite-speed');
    if (kiteSpeedElement) {
        kiteSpeedElement.textContent = `${(telemetryState.kiteSpeed * 2.23694).toFixed(1)} mph`; // Convert m/s to mph
    }
    
    // Update angle of attack display
    const angleOfAttackElement = document.getElementById('angle-of-attack');
    if (angleOfAttackElement) {
        angleOfAttackElement.textContent = `${telemetryState.angleOfAttack.toFixed(1)}°`;
    }
    
    // Update loop counters
    const loopsCWElement = document.getElementById('loops-cw');
    if (loopsCWElement) {
        loopsCWElement.textContent = telemetryState.loopsCW;
    }
    
    const loopsCCWElement = document.getElementById('loops-ccw');
    if (loopsCCWElement) {
        loopsCCWElement.textContent = telemetryState.loopsCCW;
    }
    
    // TODO: Stage 4 - Add more telemetry displays
}

/**
 * Set telemetry update interval
 * @param {number} interval - Update interval in milliseconds
 */
function setTelemetryUpdateInterval(interval) {
    telemetryState.updateInterval = interval;
}

/**
 * Get telemetry state
 * @returns {Object} Current telemetry state
 */
function getTelemetryState() {
    return { ...telemetryState }; // Return a copy to prevent direct modification
}

// Export public functions
export {
    initTelemetry,
    updateTelemetry,
    resetTelemetryCounters,
    setTelemetryUpdateInterval,
    getTelemetryState
};
