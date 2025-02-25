# Stunt Kite Simulator

A web-based 2-line stunt kite simulator featuring simplified physics, cartoony visuals, and comprehensive telemetry display for flight dynamics.

## Project Overview

This simulator provides an interactive experience for flying a two-line stunt kite in a virtual environment. The project features:

- Realistic simplified physics for kite movement and wind interaction
- Intuitive controls for manipulating kite lines
- Visual representation of airflow and wind conditions
- Multiple kite types with different flight characteristics
- Real-time telemetry display for flight data
- Scoring system based on flight performance

The simulator is designed for casual website visitors and runs on open-source Chromium-based browsers.

## Setup and Installation

1. Clone this repository
2. Open `index.html` in a Chromium-based browser
3. Alternatively, serve the files using a local development server

For development:
```bash
# Using npm and a simple http server
npm install -g http-server
http-server -p 8080

# Then navigate to http://localhost:8080 in your browser
```

## Development Approach

This project follows an iterative development process:

1. **Stage 1**: Basic Kite Rendering and Scene Setup
2. **Stage 2**: Simplified Physics and Basic Controls
3. **Stage 3**: Wind and Environmental Factors
4. **Stage 4**: Telemetry Display and Advanced Physics
5. **Stage 5**: Feature Enhancements and Refinement
6. **Stage 6**: Testing and Optimization

Each stage builds upon the previous, with clear milestones and deliverables.

## Project Structure

```
stunt-kite-sim/
├── index.html         # Main HTML file
├── style.css          # Global styles
├── src/               # Source code
│   ├── main.js        # Application entry point
│   ├── world.js       # World environment and scene setup
│   ├── kite.js        # Kite model and properties
│   ├── physics/       # Physics engine components
│   │   ├── engine.js  # Core physics calculations
│   │   ├── wind.js    # Wind simulation
│   │   └── tether.js  # Line physics
│   ├── controls.js    # User input handling
│   ├── telemetry.js   # Flight data display
│   └── utils.js       # Utility functions
├── models/            # 3D models
│   └── kite.obj       # Kite 3D model
└── docs/              # Documentation
    └── physics.md     # Physics model documentation
```

## Technologies

- **HTML5/CSS3**: For structure and styling
- **JavaScript (ES6+)**: For application logic
- **Three.js**: For 3D rendering and scene management
- **Custom Physics Engine**: For simplified aerodynamics simulation

## Controls

- **Left/Right Arrow Keys**: Adjust left/right line tension
- **Up/Down Arrow Keys**: Adjust overall line length
- **Space**: Reset kite position
- **Mouse Drag**: Rotate camera view

## Development Status

Current development stage: **Stage 1 - Basic Kite Rendering**

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please refer to the development stages in the documentation before submitting pull requests.
