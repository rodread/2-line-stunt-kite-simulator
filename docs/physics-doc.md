# Kite Flying Simulator - Physics Model Documentation

This document outlines the physics model implemented in the Kite Flying Simulator, including the forces acting on the kite, the simplified aerodynamics, and implementation details.

## Coordinate System

The simulator uses a right-handed 3D coordinate system:
- Y-axis points upward (altitude)
- Z-axis points downwind (wind blows in positive Z direction)
- X-axis points to the right when facing downwind

This coordinate system ensures intuitive control mapping where pulling the right line turns the kite right.

## Forces Acting on the Kite

The kite is modeled as a rigid body affected by the following forces:

### 1. Gravity

The gravitational force acts downward along the negative Y-axis:

```
F_gravity = m * g * (0, -1, 0)
```

Where:
- m: kite mass (kg)
- g: gravitational acceleration (9.81 m/s²)

### 2. Aerodynamic Forces

#### Wind Force

The wind exerts a force on the kite dependent on the kite's area, the wind speed, and the angle between the kite surface and the wind direction.

```
F_wind = 0.5 * ρ * v_wind² * A * C_d * wind_direction
```

Where:
- ρ: air density (1.225 kg/m³ at sea level)
- v_wind: wind speed (m/s)
- A: kite area (m²)
- C_d: drag coefficient
- wind_direction: normalized wind direction vector

#### Lift and Drag

For more accurate aerodynamics (Stage 4), the wind force is decomposed into lift and drag components:

```
F_lift = 0.5 * ρ * v_rel² * A * C_l * lift_direction
F_drag = 0.5 * ρ * v_rel² * A * C_d * (-v_rel_direction)
```

Where:
- v_rel: relative air velocity (wind velocity minus kite velocity)
- C_l: lift coefficient (dependent on angle of attack)
- C_d: drag coefficient (dependent on angle of attack)
- lift_direction: perpendicular to relative airflow direction

### 3. Bridle System

The bridle system is a network of lines that connects the kite to the control lines. It serves several important functions:

1. Distributes forces from the control lines across the kite structure
2. Maintains the kite's angle of attack relative to the wind
3. Provides stability and control

The bridle consists of multiple attachment points on the kite (top, bottom, left, right) that connect to a central bridle point where the control lines attach.

```
Bridle_tension = f(kite_orientation, wind_direction, control_inputs)
```

The bridle system helps maintain the proper angle of attack by creating a balance of forces that keeps the kite oriented correctly relative to the wind.

### 4. Tether Forces

The kite is attached to the operator via two control lines that connect to the bridle system. Each line exerts a tension force on the kite:

```
F_tether = T_left * left_direction + T_right * right_direction
```

Where:
- T_left, T_right: tension magnitudes
- left_direction, right_direction: normalized direction vectors from bridle connection point to operator

Tension is calculated based on the line properties and control inputs:

```
T = k * (distance - effective_length) * (1 + strain)
```

Where:
- k: elastic coefficient
- distance: current distance between attachment points
- effective_length: nominal line length adjusted by control input
- strain: (distance / effective_length - 1), clamped to non-negative values

## Rotational Dynamics

The kite rotation is influenced by torques generated from the asymmetrical forces, primarily from differential line tension.

```
τ = r_left × F_left + r_right × F_right + τ_aero
```

Where:
- r_left, r_right: vector from kite center of mass to attachment points
- F_left, F_right: forces applied at each attachment point
- τ_aero: aerodynamic torque

## Numerical Integration

The physics engine uses a semi-implicit Euler method for integrating the equations of motion:

```
a = F_total / m
v = v + a * dt
p = p + v * dt
```

For rotation:

```
α = τ / I
ω = ω + α * dt
θ = θ + ω * dt
```

Where:
- a: acceleration
- v: velocity
- p: position
- α: angular acceleration
- ω: angular velocity
- θ: orientation
- dt: time step
- I: moment of inertia

## Simplifications and Approximations

For performance and simplicity, the following approximations are made:

1. The kite is treated as a rigid body with fixed aerodynamic properties
2. Air density is constant (no altitude variation)
3. Wind is uniform in space (no terrain effects in basic implementation)
4. Lines are modeled with simple elasticity (no complex cable dynamics)
5. Simplified aerodynamic coefficients with limited angle of attack modeling

## Development Stages

The physics model is implemented in phases:

### Stage 1: Basic Rendering
- No physics implementation
- Static kite model with camera controls

### Stage 2: Simplified Physics
- Basic force application (gravity, simplified wind)
- Simple tether model with tension
- Rudimentary rotation from differential line tension

### Stage 3: Environmental Factors
- Enhanced wind model with gusts and turbulence
- Ground collision detection
- Improved line physics

### Stage 4: Advanced Physics
- Full aerodynamic model with lift and drag
- More accurate tether dynamics
- Realistic rotational physics for loops and tricks

### Stage 5: Feature Refinement
- Different kite types with unique flight characteristics
- Enhanced environmental effects
- Fine-tuned physics parameters

## Wind Model

The wind model uses a combination of:
- Base wind speed and direction
- Sinusoidal variation for gusts
- Random turbulence
- User-controlled wind scale

The resulting wind vector provides a realistic and dynamic force that affects the kite's movement.

## Line Controls

The two control lines are the primary user interface for flying the kite:
- Pulling the left line (increasing tension) turns the kite left
- Pulling the right line turns the kite right
- Equal tension on both lines increases speed (power stroke)
- Reducing tension on both lines allows the kite to drift with the wind

Line length can also be adjusted to control the kite's position in the wind window.
