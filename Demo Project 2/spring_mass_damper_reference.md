# Spring-Mass-Damper Impulse Response — Reference Calculations

## System Description

Horizontal spring-mass-damper subjected to an impulse force F(t) = δ(t).
Damping modeled as viscous friction (force proportional to velocity).

Equation of motion:

    m·ẍ + c·ẋ + k·x = F(t)

Parameters:
- **m** — mass [kg]
- **c** — viscous damping coefficient [N·s/m]
- **k** — spring stiffness [N/m]

---

## Transfer Function

Taking the Laplace transform (zero initial conditions):

    (ms² + cs + k) X(s) = F(s)

**General form:**

    X(s)       1
    ──── = ─────────────
    F(s)   ms² + cs + k

**Standard second-order form** (divide numerator and denominator by m):

    X(s)       1/m
    ──── = ───────────────────
    F(s)   s² + 2ζωₙs + ωₙ²

---

## Key Parameters

### Natural Frequency

    ωₙ = √(k/m)     [rad/s]

### Damping Ratio

    ζ = c / (2√(mk))     [dimensionless]

### Time Constant

    τ = 1 / (ζωₙ)     [s]

The time constant is the time for the envelope to decay to e⁻¹ ≈ 36.8% of its initial amplitude.

### Damped Natural Frequency (underdamped only)

    ωd = ωₙ√(1 − ζ²)     [rad/s]

---

## Characteristic Roots (Poles)

The poles of the transfer function are the roots of:

    ms² + cs + k = 0
    s² + 2ζωₙs + ωₙ² = 0

Using the quadratic formula:

    s₁,₂ = −ζωₙ ± ωₙ√(ζ² − 1)

The real part σ = −ζωₙ determines the decay rate.
The imaginary part ωd = ωₙ√|ζ²−1| determines the oscillation frequency.

All poles lie on a circle of radius ωₙ in the complex s-plane:

    |s₁,₂| = ωₙ

The angle from the negative real axis satisfies:

    cos(θ) = ζ

---

## Damping Regimes

### Underdamped  (ζ < 1)

Poles are complex conjugates:

    s₁,₂ = −ζωₙ ± j·ωd,    ωd = ωₙ√(1 − ζ²)

Impulse response:

    x(t) = (1 / (m·ωd)) · e^(−ζωₙt) · sin(ωd·t),    t ≥ 0

Decaying envelope:

    ±A(t) = ±(1 / (m·ωd)) · e^(−ζωₙt)

### Critically Damped  (ζ = 1)

Repeated real pole:

    s₁,₂ = −ωₙ   (repeated)

Impulse response:

    x(t) = (t / m) · e^(−ωₙt),    t ≥ 0

### Overdamped  (ζ > 1)

Two distinct real poles:

    s₁,₂ = −ζωₙ ± ωₙ√(ζ² − 1)

Define the "hyperbolic damped frequency":

    ωh = ωₙ√(ζ² − 1)

Impulse response:

    x(t) = (1 / (m·ωh)) · e^(−ζωₙt) · sinh(ωh·t),    t ≥ 0

Note: for ζ >> 1, the slower pole −ζωₙ + ωh dominates and the response approximates a simple first-order decay.

---

## Energy and Peak Response

For the underdamped case, the peak displacement occurs at:

    t_peak = π / (2·ωd)   (first peak of sin)

Peak amplitude:

    x_peak = (1 / (m·ωd)) · e^(−ζωₙ · π/(2ωd))

---

## Plot Axis Choices

### Pole-Zero Map (s-plane)
- Horizontal axis: real part σ (always negative for stable system)
- Vertical axis: imaginary part jω
- Axis range: ±1.35·max(ωₙ, |Re(s)|, |Im(s)|)
- Reference circle of radius ωₙ centered at origin

### Impulse Response (time domain)
- Time horizon: max(5τ, 5/ωₙ), capped at 200 s
- y-axis range: ±1.15 · peak |x(t)|
- 600 uniformly-spaced sample points

---

## Units Summary

| Symbol | Quantity                   | Unit        |
|--------|----------------------------|-------------|
| m      | Mass                       | kg          |
| c      | Damping coefficient        | N·s/m       |
| k      | Spring stiffness           | N/m         |
| ωₙ     | Natural frequency          | rad/s       |
| ωd     | Damped natural frequency   | rad/s       |
| ζ      | Damping ratio              | —           |
| τ      | Time constant              | s           |
| x(t)   | Displacement               | m           |
| F(t)   | Applied force (impulse)    | N·s (≡ kg·m/s) |
