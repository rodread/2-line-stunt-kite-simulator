/**
 * Kite Flying Simulator - Controls Module
 * 
 * This module handles user input for kite control, including:
 * - Keyboard input
 * - UI controls (sliders, buttons)
 * - Control mapping and configuration
 */

import { setLeftInput, setRightInput, setOverallLineLength, setDifferentialLineLength } from './physics/tether.js';
import { setWindSpeed } from './physics/wind.js';
import { changeKiteType, resetKite } from './kite.js';

// Control state
const controlState = {
    // Keyboard state
    keys: {},
    
    // Control mappings
    controlMappings: {
        'ArrowLeft': 'leftLine',
        'ArrowRight': 'rightLine',
        'ArrowUp': 'lineIn',
        'ArrowDown': 'lineOut',
        'r': 'reset',
        ' ': 'reset', // Space bar
    },
    
    // Control settings
    sensitivity: 1.0,
    invertX: false,
    invertY: false,
    
    // Control values
    leftLine: 0.5,  // 0-1 range
    rightLine: 0.5, // 0-1 range
    lineLength: 0.5, // 0-1 range (0.5 is neutral)
    windSpeed: 0.5  // 0-1 range
};

/**
 * Initialize controls
 */
function initControls() {
    console.log('Initializing controls...');
    
    // Set up keyboard event listeners
    setupKeyboardControls();
    
    // Set up UI control listeners
    setupUIControls();
    
    // TODO: Stage 2 - Add more control options and mappings
}

/**
 * Set up keyboard event listeners
 */
function setupKeyboardControls() {
    // Key down event
    window.addEventListener('keydown', (event) => {
        controlState.keys[event.key] = true;
    });
    
    // Key up event
    window.addEventListener('keyup', (event) => {
        controlState.keys[event.key] = false;
        
        // Handle one-shot actions on key up
        handleOneTimeActions(event.key);
    });
}

/**
 * Handle one-time actions triggered on key up
 * @param {string} key - The key that was released
 */
function handleOneTimeActions(key) {
    // Check mapped actions
    const action = controlState.controlMappings[key];
    
    if (action === 'reset') {
        resetKite();
    }
    
    // TODO: Stage 2 - Add more one-time actions
}

/**
 * Set up UI control event listeners
 */
function setupUIControls() {
    // Wind control slider
    const windControl = document.getElementById('wind-control');
    if (windControl) {
        windControl.addEventListener('input', () => {
            const value = parseFloat(windControl.value) / 100;
            controlState.windSpeed = value;
            setWindSpeed(value);
            
            // Update displayed value
            const windValueDisplay = document.getElementById('wind-control-value');
            if (windValueDisplay) {
                windValueDisplay.textContent = `${Math.round(value * 100)}%`;
            }
        });
    }
    
    // Line length slider
    const lineLengthControl = document.getElementById('line-length');
    if (lineLengthControl) {
        lineLengthControl.addEventListener('input', () => {
            const value = parseFloat(lineLengthControl.value) / 100;
            controlState.lineLength = value;
            
            // Map 0-1 to -1 to 1 range for length adjustment (0.5 is neutral)
            const lengthAdjustment = (value - 0.5) * 2;
            setOverallLineLength(lengthAdjustment);
            
            // Update displayed value
            const lineLengthDisplay = document.getElementById('line-length-value');
            if (lineLengthDisplay) {
                lineLengthDisplay.textContent = `${Math.round(value * 100)}%`;
            }
        });
    }
    
    // Left line control
    const leftLineControl = document.getElementById('left-line');
    if (leftLineControl) {
        leftLineControl.addEventListener('input', () => {
            const value = parseFloat(leftLineControl.value) / 100;
            controlState.leftLine = value;
            setLeftInput(value);
        });
    }
    
    // Right line control
    const rightLineControl = document.getElementById('right-line');
    if (rightLineControl) {
        rightLineControl.addEventListener('input', () => {
            const value = parseFloat(rightLineControl.value) / 100;
            controlState.rightLine = value;
            setRightInput(value);
        });
    }
    
    // Kite type selector
    const kiteSelector = document.getElementById('kite-select');
    if (kiteSelector) {
        kiteSelector.addEventListener('change', () => {
            const kiteType = kiteSelector.value;
            changeKiteType(kiteType);
        });
    }
    
    // TODO: Stage 5 - Add more UI control listeners
}

/**
 * Poll controls and update control values
 * Called every frame to process continuous inputs
 */
function pollControls() {
    // Handle keyboard controls
    
    // Left/Right controls (for left/right lines)
    if (controlState.keys['ArrowLeft']) {
        controlState.leftLine = Math.min(1.0, controlState.leftLine + 0.01 * controlState.sensitivity);
        setLeftInput(controlState.leftLine);
        updateUIControl('left-line', controlState.leftLine);
    } else if (controlState.keys['a'] || controlState.keys['A']) {
        controlState.leftLine = Math.max(0.0, controlState.leftLine - 0.01 * controlState.sensitivity);
        setLeftInput(controlState.leftLine);
        updateUIControl('left-line', controlState.leftLine);
    }
    
    if (controlState.keys['ArrowRight']) {
        controlState.rightLine = Math.min(1.0, controlState.rightLine + 0.01 * controlState.sensitivity);
        setRightInput(controlState.rightLine);
        updateUIControl('right-line', controlState.rightLine);
    } else if (controlState.keys['d'] || controlState.keys['D']) {
        controlState.rightLine = Math.max(0.0, controlState.rightLine - 0.01 * controlState.sensitivity);
        setRightInput(controlState.rightLine);
        updateUIControl('right-line', controlState.rightLine);
    }
    
    // Up/Down controls (for line length)
    if (controlState.keys['ArrowUp']) {
        controlState.lineLength = Math.min(1.0, controlState.lineLength + 0.01 * controlState.sensitivity);
        const lengthAdjustment = (controlState.lineLength - 0.5) * 2;
        setOverallLineLength(lengthAdjustment);
        updateUIControl('line-length', controlState.lineLength);
    } else if (controlState.keys['ArrowDown']) {
        controlState.lineLength = Math.max(0.0, controlState.lineLength - 0.01 * controlState.sensitivity);
        const lengthAdjustment = (controlState.lineLength - 0.5) * 2;
        setOverallLineLength(lengthAdjustment);
        updateUIControl('line-length', controlState.lineLength);
    }
    
    // TODO: Stage 2 - Add more keyboard controls
}

/**
 * Update UI control to match internal state
 * @param {string} controlId - ID of the HTML control
 * @param {number} value - New value (0-1 range)
 */
function updateUIControl(controlId, value) {
    const control = document.getElementById(controlId);
    if (control) {
        control.value = value * 100;
        
        // Update displayed value if applicable
        const valueDisplay = document.getElementById(`${controlId}-value`);
        if (valueDisplay) {
            valueDisplay.textContent = `${Math.round(value * 100)}%`;
        }
    }
}

/**
 * Set control sensitivity
 * @param {number} sensitivity - New sensitivity value
 */
function setControlSensitivity(sensitivity) {
    controlState.sensitivity = sensitivity;
}

/**
 * Set control inversion
 * @param {string} axis - Axis to invert ('x' or 'y')
 * @param {boolean} inverted - Whether the axis should be inverted
 */
function setControlInversion(axis, inverted) {
    if (axis === 'x') {
        controlState.invertX = inverted;
    } else if (axis === 'y') {
        controlState.invertY = inverted;
    }
}

/**
 * Get current control state
 * @returns {Object} Current control state
 */
function getControlState() {
    return { ...controlState }; // Return a copy to prevent direct modification
}

// Export public functions
export {
    initControls,
    pollControls,
    setControlSensitivity,
    setControlInversion,
    getControlState
};
