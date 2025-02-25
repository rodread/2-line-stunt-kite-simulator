/**
 * Kite Flying Simulator - Utility Functions
 * 
 * This module provides utility functions and classes used throughout the application.
 */

/**
 * FPS Counter class for tracking frame rate
 */
class FPSCounter {
    constructor() {
        this.fps = 0;
        this.frames = 0;
        this.lastTime = performance.now();
        this.updateInterval = 1000; // Update FPS every second
    }
    
    /**
     * Update the FPS counter
     */
    update() {
        this.frames++;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;
        
        if (elapsed >= this.updateInterval) {
            this.fps = (this.frames * 1000) / elapsed;
            this.frames = 0;
            this.lastTime = currentTime;
        }
    }
    
    /**
     * Get the current FPS
     * @returns {number} Current frames per second
     */
    getFPS() {
        return this.fps;
    }
}

/**
 * Vector3 utility class for 3D vector operations
 */
class Vector3 {
    /**
     * Create a new Vector3
     * @param {number} x - X component
     * @param {number} y - Y component
     * @param {number} z - Z component
     */
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    /**
     * Add another vector to this one
     * @param {Vector3} v - Vector to add
     * @returns {Vector3} This vector after addition
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    
    /**
     * Subtract another vector from this one
     * @param {Vector3} v - Vector to subtract
     * @returns {Vector3} This vector after subtraction
     */
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }
    
    /**
     * Multiply this vector by a scalar
     * @param {number} scalar - Scalar value
     * @returns {Vector3} This vector after multiplication
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }
    
    /**
     * Calculate the dot product with another vector
     * @param {Vector3} v - Vector for dot product
     * @returns {number} Dot product
     */
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    
    /**
     * Calculate the cross product with another vector
     * @param {Vector3} v - Vector for cross product
     * @returns {Vector3} New vector representing the cross product
     */
    cross(v) {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }
    
    /**
     * Calculate the magnitude (length) of this vector
     * @returns {number} Vector magnitude
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    
    /**
     * Normalize this vector (make it unit length)
     * @returns {Vector3} This vector after normalization
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
            this.z /= mag;
        }
        return this;
    }
    
    /**
     * Create a copy of this vector
     * @returns {Vector3} New vector with the same components
     */
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
    
    /**
     * Calculate the distance to another vector
     * @param {Vector3} v - Vector to calculate distance to
     * @returns {number} Distance between vectors
     */
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * Convert to an object with x, y, z properties
     * @returns {Object} Object representation
     */
    toObject() {
        return { x: this.x, y: this.y, z: this.z };
    }
    
    /**
     * Set the components of this vector
     * @param {number} x - X component
     * @param {number} y - Y component
     * @param {number} z - Z component
     * @returns {Vector3} This vector after setting components
     */
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    
    /**
     * Copy components from another vector
     * @param {Vector3} v - Vector to copy from
     * @returns {Vector3} This vector after copying
     */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }
}

/**
 * MathUtils - Static utility functions for mathematical operations
 */
class MathUtils {
    /**
     * Convert degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Convert radians to degrees
     * @param {number} radians - Angle in radians
     * @returns {number} Angle in degrees
     */
    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }
    
    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    /**
     * Linear interpolation between two values
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * Map a value from one range to another
     * @param {number} value - Value to map
     * @param {number} inMin - Input range minimum
     * @param {number} inMax - Input range maximum
     * @param {number} outMin - Output range minimum
     * @param {number} outMax - Output range maximum
     * @returns {number} Mapped value
     */
    static map(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }
    
    /**
     * Generate a random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Generate a random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Export utility classes and functions
export {
    FPSCounter,
    Vector3,
    MathUtils
};
