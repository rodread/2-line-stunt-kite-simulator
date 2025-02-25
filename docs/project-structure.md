# Stunt Kite Simulator Project Structure

```
stunt-kite-sim/
├── index.html                  # Main application HTML
├── style.css                   # Global styles
├── README.md                   # Project documentation
├── LICENSE                     # Apache 2.0 license
│
├── src/                        # Source code
│   ├── main.js                 # Application entry point
│   ├── world.js                # 3D world setup and rendering
│   ├── kite.js                 # Kite model and properties
│   ├── controls.js             # User input handling
│   ├── telemetry.js            # Flight data display
│   ├── utils.js                # Utility functions
│   │
│   └── physics/                # Physics engine components
│       ├── engine.js           # Core physics calculations
│       ├── wind.js             # Wind simulation
│       └── tether.js           # Line/tether physics
│
├── models/                     # 3D model assets
│   └── kite.obj                # Kite 3D model
│
├── assets/                     # Other assets
│   ├── textures/               # Texture files
│   │   ├── ground.jpg          # Ground texture
│   │   └── sky.jpg             # Sky texture
│   │
│   └── sounds/                 # Sound effects
│       ├── wind.mp3            # Wind ambient sound
│       └── line_tension.mp3    # Line tension sound
│
└── docs/                       # Documentation
    ├── physics.md              # Physics model documentation
    └── project_plan.md         # Development plan and stages
```

## File Responsibilities

### Core Files
- **index.html**: Main HTML structure, UI elements, and script loading
- **style.css**: Global styling for the application
- **README.md**: Project overview, setup instructions, and usage details
- **LICENSE**: Apache 2.0 license file

### Source Code
- **main.js**: Initializes all modules, manages loading sequence, and controls application flow
- **world.js**: Sets up the Three.js scene, camera, lighting, and environmental elements
- **kite.js**: Manages the kite model, properties, and state
- **controls.js**: Handles user input (keyboard, mouse, UI controls)
- **telemetry.js**: Calculates and displays flight data and metrics
- **utils.js**: Provides utility functions and classes used throughout the application

### Physics Module
- **engine.js**: Core physics logic, integrates forces and manages physics state
- **wind.js**: Simulates wind dynamics, gusts, and calculates wind forces
- **tether.js**: Models line dynamics, tension calculations, and visualizes tethers

### Assets
- **models/**: Contains 3D model files for the kite and environment
- **assets/textures/**: Texture files for visual elements
- **assets/sounds/**: Sound effects and ambient audio

### Documentation
- **physics.md**: Detailed explanation of the physics model and calculations
- **project_plan.md**: Development stages, tasks, and implementation plan

## Module Dependencies

```
main.js
  ├── world.js
  ├── kite.js
  │     └── physics/tether.js
  ├── controls.js
  ├── telemetry.js
  │     ├── kite.js
  │     └── physics/wind.js
  ├── physics/engine.js
  │     ├── kite.js
  │     ├── physics/wind.js
  │     └── physics/tether.js
  └── utils.js
```

## Development Workflow

1. Start with **world.js** and basic rendering
2. Implement **kite.js** for model loading and basic properties
3. Create the physics engine foundation in **physics/** modules
4. Implement user controls in **controls.js**
5. Add telemetry and data visualization in **telemetry.js**
6. Refine and enhance all modules following the project plan stages
