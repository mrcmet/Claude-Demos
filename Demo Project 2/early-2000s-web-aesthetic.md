# Early 2000s Web Aesthetic Reference (1999-2005)
## Academic/Educational Tool Design

**Researched**: 2026-04-30 | **Focus**: Educational/academic websites, Windows XP era, early interactive tools

---

## Table of Contents
- [Color Palettes](#color-palettes)
- [Typography](#typography)
- [Layout Patterns](#layout-patterns)
- [UI Elements](#ui-elements)
- [Decorative Effects](#decorative-effects)
- [Background Patterns](#background-patterns)
- [Navigation Aesthetics](#navigation-aesthetics)
- [Complete Code Example](#complete-code-example)
- [Official Resources](#official-resources)

---

## Color Palettes

### Primary Educational Colors
Early 2000s academic websites favored subdued, professional color schemes inspired by Windows XP and corporate interfaces:

| Color | Hex Code | Usage | Notes |
|-------|----------|-------|-------|
| Steel Blue | `#4682B4` | Headers, primary UI | Professional, academic feel |
| Navy Blue | `#000080` | Links, borders, dark elements | High contrast with white |
| Light Steel Blue | `#B0C4DE` | Backgrounds, panels | Soft, non-aggressive |
| Web Gray | `#808080` | Text, dividers, secondary elements | Medium gray for subtlety |
| Light Gray | `#D3D3D3` | Borders, subtle backgrounds | Lighter accent |
| White | `#FFFFFF` | Main background | Clean, readable |
| Dark Blue | `#003366` | Text, strong emphasis | Darker variant of steel blue |
| Teal | `#008080` | Accent color, headings | Secondary accent |
| Bright Blue | `#0066CC` | Hyperlinks | Standard web link color |

### Windows XP Influence
Color palette reflected Microsoft's ecosystem:
- Cool blues and cyans dominating
- Subtle greens and teals for accents
- Gray for UI chrome and borders
- Minimal use of warm colors (yellows, oranges reserved for warnings/alerts)

### Practical Palette
```css
:root {
  --steel-blue: #4682B4;
  --navy: #000080;
  --light-steel: #B0C4DE;
  --web-gray: #808080;
  --light-gray: #D3D3D3;
  --link-blue: #0066CC;
  --dark-blue: #003366;
  --teal: #008080;
}
```

---

## Typography

### Font Families
The "web-safe" fonts of the 2000s (required fallbacks for absent system fonts):

| Font | Usage | CSS Stack |
|------|-------|-----------|
| **Verdana** | Body text, small sizes | Most readable on screens |
| **Tahoma** | Headers, UI text | Default Windows XP font |
| **Arial** | General text, fallback | Universal availability |
| **Georgia** | Serif option (rare) | More formal documents |

**Why these fonts?**
- Designed specifically for low-resolution screens
- Large x-height and generous letter spacing
- Bundled with Windows 2000/XP/Office 97+
- All available on 99%+ of computers in 2000-2005

### Font Sizes and Weights
```css
body {
  font-family: Verdana, Tahoma, Arial, sans-serif;
  font-size: 12px;  /* 12px was standard for body text */
  line-height: 1.4;
  color: #333333;
}

h1 {
  font-family: Tahoma, Arial, sans-serif;
  font-size: 18px;
  font-weight: bold;
  color: #003366;
}

h2 {
  font-family: Tahoma, Arial, sans-serif;
  font-size: 14px;
  font-weight: bold;
  color: #4682B4;
}

h3 {
  font-family: Verdana, Arial, sans-serif;
  font-size: 12px;
  font-weight: bold;
  color: #008080;
}

/* Text decorations common in early 2000s */
a {
  color: #0066CC;
  text-decoration: underline;
}

a:visited {
  color: #800080;  /* Purple for visited links */
}

a:hover {
  color: #0033AA;
  text-decoration: underline;
}

strong {
  font-weight: bold;
  color: #003366;
}

em {
  font-style: italic;
  color: #666666;
}
```

### Special Typography Effects
- **Underlined links**: Universal in early 2000s (no exceptions)
- **Visited links**: Purple (#800080) to indicate already-viewed pages
- **Small text**: 11px for captions, 10px for copyright notice
- **Monospace**: `Courier New` for code, 11px size

---

## Layout Patterns

### Table-Based Layout (The Standard)
Early 2000s sites used HTML tables for page structure, not just data:

```html
<!-- Main page structure using nested tables -->
<table border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td colspan="2" bgcolor="#4682B4" height="60">
      <!-- Header/Banner -->
    </td>
  </tr>
  <tr>
    <td width="20%" bgcolor="#B0C4DE" valign="top">
      <!-- Left navigation sidebar -->
    </td>
    <td width="80%" bgcolor="#FFFFFF" valign="top">
      <!-- Main content -->
    </td>
  </tr>
  <tr>
    <td colspan="2" bgcolor="#CCCCCC" height="20">
      <!-- Footer -->
    </td>
  </tr>
</table>
```

### Fixed Width Design
- **Page width**: Typically 760px, 800px, or 900px (optimized for 1024x768 resolution)
- **Nested tables**: Complex layouts built with 3-5 levels of nested tables
- **Spacer GIFs**: Single-pixel transparent GIFs used to control spacing
- **Centered content**: `<center>` tag or `margin: 0 auto` on outer table

```html
<!-- Typical outer structure -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="800">
  <!-- Content rows -->
</table>
```

### Two-Column Layout Pattern
```html
<table width="800" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <!-- Left column: 180px -->
    <td width="180" bgcolor="#B0C4DE" valign="top">
      <table width="100%" cellpadding="5" cellspacing="0" border="0">
        <tr>
          <td class="nav-header">Navigation</td>
        </tr>
        <tr>
          <td class="nav-content">Links here</td>
        </tr>
      </table>
    </td>
    <!-- Right column: 620px -->
    <td width="620" bgcolor="#FFFFFF" valign="top" padding="10">
      <h1>Main Content</h1>
      <p>Content here</p>
    </td>
  </tr>
</table>
```

### Grid-Based Content Boxes
Content displayed in aligned boxes with borders:

```html
<table width="100%" cellpadding="5" cellspacing="5" border="0">
  <tr>
    <td width="33%" bgcolor="#F0F0F0" border="1px solid #999999">
      <h3>Box 1</h3>
      <p>Content</p>
    </td>
    <td width="33%" bgcolor="#F0F0F0" border="1px solid #999999">
      <h3>Box 2</h3>
      <p>Content</p>
    </td>
    <td width="33%" bgcolor="#F0F0F0" border="1px solid #999999">
      <h3>Box 3</h3>
      <p>Content</p>
    </td>
  </tr>
</table>
```

---

## UI Elements

### Button Styling
Early 2000s buttons had a beveled, 3D appearance mimicking physical buttons:

```css
button, input[type="button"], input[type="submit"] {
  background-color: #C0C0C0;  /* Light gray */
  color: #000000;
  padding: 4px 12px;
  border: 2px outset #DFDFDF;  /* Beveled effect */
  border-right: 2px solid #808080;
  border-bottom: 2px solid #808080;
  font-family: Tahoma, Arial, sans-serif;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
}

button:active, input[type="button"]:active {
  border-style: inset;  /* Pressed state */
  border-left: 2px solid #808080;
  border-top: 2px solid #808080;
  border-right: 2px solid #DFDFDF;
  border-bottom: 2px solid #DFDFDF;
}
```

### Form Inputs
```css
input[type="text"], 
input[type="password"], 
textarea, 
select {
  background-color: #FFFFFF;
  color: #000000;
  border: 1px solid #999999;
  padding: 3px 4px;
  font-family: Verdana, Arial, sans-serif;
  font-size: 11px;
}

input[type="text"]:focus,
textarea:focus,
select:focus {
  background-color: #FFFFCC;  /* Pale yellow highlight */
  border: 1px solid #0066CC;
}

label {
  font-family: Verdana, Arial, sans-serif;
  font-size: 11px;
  color: #000000;
  display: block;
  margin-top: 5px;
  margin-bottom: 2px;
}
```

### Sliders and Input Range
Early 2000s relied on custom inputs with beveled borders:

```css
input[type="range"] {
  width: 150px;
  height: 20px;
  accent-color: #4682B4;
  border: 1px solid #999999;
}

/* Fallback for text input simulating slider */
input.slider-sim {
  width: 200px;
  border: 1px inset #999999;
  background: linear-gradient(to right, 
    #4682B4 0%, 
    #B0C4DE 100%);
  padding: 4px;
  height: 16px;
}
```

### Panel/Box Borders
Typical beveled box style (common in every UI):

```css
.panel {
  background-color: #C0C0C0;
  border: 2px outset #DFDFDF;
  border-right: 2px solid #808080;
  border-bottom: 2px solid #808080;
  padding: 8px;
}

.panel-header {
  background: linear-gradient(to bottom, 
    #000080 0%, 
    #4682B4 100%);
  color: #FFFFFF;
  padding: 4px;
  font-weight: bold;
  font-size: 11px;
  border: 1px solid #000000;
}

.panel-content {
  background-color: #FFFFFF;
  padding: 8px;
  border: 1px solid #999999;
}
```

### Horizontal Rules
```css
hr {
  border: 0;
  border-top: 1px solid #999999;
  border-bottom: 1px solid #FFFFFF;
  height: 2px;
  background-color: #CCCCCC;
  margin: 10px 0;
}

/* Alternative: embossed hr */
hr.embossed {
  border: 0;
  border-top: 1px solid #808080;
  border-bottom: 1px solid #DFDFDF;
  height: 2px;
  background-color: #C0C0C0;
}
```

---

## Decorative Effects

### Beveled/Raised Borders (Windows 3.1 Style)
The signature aesthetic of early 2000s interfaces:

```css
.beveled-raised {
  border: 2px outset #DFDFDF;
  border-right: 2px solid #808080;
  border-bottom: 2px solid #808080;
}

.beveled-inset {
  border: 2px inset #DFDFDF;
  border-right: 2px solid #808080;
  border-bottom: 2px solid #808080;
}

.beveled-box {
  border-top: 1px solid #FFFFFF;
  border-left: 1px solid #FFFFFF;
  border-right: 1px solid #808080;
  border-bottom: 1px solid #808080;
  background-color: #C0C0C0;
  padding: 4px;
}
```

### Drop Shadows (Early CSS)
CSS2 didn't have box-shadow, but filter effects existed:

```css
/* IE5+ only - common hack of the era */
.drop-shadow {
  filter: progid:DXImageTransform.Microsoft.Shadow(color='#999999', Direction=135, Strength=3);
}

/* Modern equivalent for fallback */
.drop-shadow-modern {
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}
```

### Gradients (Limited Support)
True gradients weren't widely supported; designers used background images instead:

```css
.gradient-blue {
  background: linear-gradient(to bottom, 
    #4682B4 0%, 
    #B0C4DE 100%);
  /* Fallback solid color */
  background-color: #7AB4DC;
}

.gradient-gray {
  background: linear-gradient(to bottom, 
    #DFDFDF 0%, 
    #A0A0A0 100%);
  background-color: #C0C0C0;
}

/* Actual 2000s approach: background image */
.gradient-bg {
  background-image: url('gradient-blue.gif');
  background-repeat: repeat-x;
}
```

### Text Effects
```css
.embossed-text {
  color: #666666;
  text-shadow: 1px 1px 0 #FFFFFF;
}

.shadow-text {
  color: #000000;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
}

/* Glow effect (rare, Flash-like) */
.glowing-text {
  color: #0066CC;
  text-shadow: 0 0 5px #4682B4;
}
```

---

## Background Patterns

### Solid Colors
Backgrounds were almost always solid:

```css
body {
  background-color: #FFFFFF;  /* Pure white - most common */
}

/* Alternative light backgrounds */
.bg-cream {
  background-color: #FFFEF0;  /* Slight off-white */
}

.bg-light-gray {
  background-color: #F5F5F5;  /* Very light gray */
}

.bg-light-blue {
  background-color: #E8F0F8;  /* Pale educational blue */
}

.bg-light-steel {
  background-color: #B0C4DE;  /* Steel blue panel */
}
```

### Tiled Backgrounds (Less Common in Educational Sites)
When used, subtle and non-intrusive:

```css
.tiled-bg {
  background-image: url('subtle-grid.gif');
  background-repeat: repeat;
  background-attachment: scroll;
}

/* Common: very subtle diagonal lines or dots */
.texture-dots {
  background-image: url('dots-4px.gif');  /* 4x4 dot pattern */
  background-color: #FFFFFF;
  background-repeat: repeat;
}
```

### Panel Backgrounds
```css
.content-panel {
  background-color: #FFFFFF;
  background-image: none;
}

.sidebar-panel {
  background-color: #B0C4DE;
  background-image: none;
}

.header-panel {
  background: linear-gradient(to right, 
    #003366 0%, 
    #4682B4 100%);
  color: #FFFFFF;
}
```

---

## Navigation Aesthetics

### Header/Banner
```html
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#003366">
  <tr>
    <td height="60" padding="10">
      <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">
        Department of Physics
      </h1>
      <p style="color: #B0C4DE; margin: 2px 0 0 0; font-size: 11px;">
        Interactive Education Tools
      </p>
    </td>
  </tr>
</table>
```

### Vertical Navigation Sidebar
```html
<table width="180" cellpadding="0" cellspacing="0" bgcolor="#B0C4DE">
  <tr>
    <td>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr bgcolor="#4682B4">
          <td padding="6">
            <h3 style="color: #FFFFFF; margin: 0; font-size: 12px;">
              Navigation
            </h3>
          </td>
        </tr>
        <tr>
          <td padding="8">
            <a href="#" style="display: block; margin: 4px 0;">
              • Home
            </a>
            <a href="#" style="display: block; margin: 4px 0;">
              • Simulations
            </a>
            <a href="#" style="display: block; margin: 4px 0;">
              • Documentation
            </a>
            <a href="#" style="display: block; margin: 4px 0;">
              • Contact
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

### Horizontal Tab Navigation (Less Common But Present)
```css
.tab-bar {
  background-color: #C0C0C0;
  border-bottom: 1px solid #999999;
  padding: 4px;
}

.tab {
  background-color: #C0C0C0;
  color: #000000;
  padding: 4px 12px;
  border: 1px solid #999999;
  margin-right: 2px;
  display: inline-block;
  border-bottom: 1px solid #C0C0C0;
}

.tab.active {
  background-color: #FFFFFF;
  border-bottom: 1px solid #FFFFFF;
  color: #0066CC;
  font-weight: bold;
}

.tab:hover {
  background-color: #D9D9D9;
}
```

### Breadcrumb Navigation
```html
<p style="font-size: 11px; color: #666666;">
  <a href="#">Home</a> 
  &gt; <a href="#">Simulations</a> 
  &gt; <a href="#">Mechanics</a> 
  &gt; <strong>Pendulum</strong>
</p>
```

---

## Complete Code Example

A minimal early 2000s educational tool website:

```html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
  "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
  <title>Physics Lab - Interactive Pendulum Simulation</title>
  <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
  <style type="text/css">
    * {
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: Verdana, Tahoma, Arial, sans-serif;
      font-size: 12px;
      background-color: #FFFFFF;
      color: #333333;
      line-height: 1.5;
    }
    
    a {
      color: #0066CC;
      text-decoration: underline;
    }
    
    a:visited {
      color: #800080;
    }
    
    a:hover {
      color: #0033AA;
      text-decoration: underline;
    }
    
    h1 {
      font-family: Tahoma, Arial, sans-serif;
      font-size: 18px;
      font-weight: bold;
      color: #003366;
      margin: 10px 0;
    }
    
    h2 {
      font-family: Tahoma, Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      color: #4682B4;
      margin: 8px 0;
      border-bottom: 1px solid #B0C4DE;
      padding-bottom: 4px;
    }
    
    h3 {
      font-family: Verdana, Arial, sans-serif;
      font-size: 12px;
      font-weight: bold;
      color: #008080;
      margin: 6px 0;
    }
    
    .header {
      background: linear-gradient(to right, #003366 0%, #4682B4 100%);
      color: #FFFFFF;
      padding: 15px;
      border-bottom: 2px solid #000000;
    }
    
    .header h1 {
      color: #FFFFFF;
      font-size: 24px;
      margin: 0;
    }
    
    .header p {
      color: #B0C4DE;
      font-size: 11px;
      margin: 4px 0 0 0;
    }
    
    .container {
      width: 800px;
      margin: 0 auto;
    }
    
    .content {
      display: flex;
      min-height: 500px;
    }
    
    .sidebar {
      width: 200px;
      background-color: #B0C4DE;
      padding: 0;
      margin-right: 0;
    }
    
    .nav-header {
      background-color: #4682B4;
      color: #FFFFFF;
      padding: 8px;
      font-weight: bold;
      font-size: 12px;
      border-bottom: 1px solid #000080;
    }
    
    .nav-content {
      padding: 10px;
    }
    
    .nav-content a {
      display: block;
      margin: 6px 0;
      padding: 4px;
      text-decoration: none;
      color: #003366;
      font-weight: bold;
    }
    
    .nav-content a:visited {
      color: #003366;
    }
    
    .nav-content a:hover {
      background-color: #9BB1D6;
      padding-left: 8px;
    }
    
    .main {
      flex: 1;
      background-color: #FFFFFF;
      padding: 15px;
    }
    
    .panel {
      background-color: #FFFFFF;
      border: 1px solid #999999;
      margin: 15px 0;
      padding: 0;
    }
    
    .panel-header {
      background-color: #4682B4;
      color: #FFFFFF;
      padding: 8px;
      font-weight: bold;
    }
    
    .panel-body {
      padding: 12px;
      background-color: #FFFFFF;
    }
    
    .footer {
      background-color: #C0C0C0;
      border-top: 1px solid #999999;
      padding: 10px;
      text-align: center;
      font-size: 10px;
      color: #666666;
      clear: both;
    }
    
    button, input[type="button"], input[type="submit"] {
      background-color: #C0C0C0;
      color: #000000;
      padding: 4px 12px;
      border: 2px outset #DFDFDF;
      border-right: 2px solid #808080;
      border-bottom: 2px solid #808080;
      font-family: Tahoma, Arial, sans-serif;
      font-size: 11px;
      font-weight: bold;
      cursor: pointer;
    }
    
    button:active, input[type="button"]:active, input[type="submit"]:active {
      border-style: inset;
      border-left: 2px solid #808080;
      border-top: 2px solid #808080;
      border-right: 2px solid #DFDFDF;
      border-bottom: 2px solid #DFDFDF;
    }
    
    button:hover, input[type="button"]:hover, input[type="submit"]:hover {
      background-color: #DFDFDF;
    }
    
    input[type="text"],
    input[type="password"],
    textarea,
    select {
      background-color: #FFFFFF;
      color: #000000;
      border: 1px solid #999999;
      padding: 3px 4px;
      font-family: Verdana, Arial, sans-serif;
      font-size: 11px;
    }
    
    input[type="text"]:focus,
    textarea:focus,
    select:focus {
      background-color: #FFFFCC;
      border: 1px solid #0066CC;
    }
    
    label {
      font-family: Verdana, Arial, sans-serif;
      font-size: 11px;
      display: block;
      margin-top: 8px;
      margin-bottom: 3px;
      font-weight: bold;
      color: #003366;
    }
    
    .code {
      background-color: #F0F0F0;
      border: 1px solid #CCCCCC;
      padding: 8px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #000000;
      margin: 5px 0;
      overflow-x: auto;
    }
    
    hr {
      border: 0;
      border-top: 1px solid #999999;
      border-bottom: 1px solid #FFFFFF;
      height: 2px;
      background-color: #CCCCCC;
      margin: 15px 0;
    }
    
    .breadcrumb {
      font-size: 11px;
      color: #666666;
      margin: 10px 0;
    }
    
    .warning {
      background-color: #FFFFCC;
      border: 1px solid #FFCC00;
      padding: 8px;
      margin: 10px 0;
      color: #333333;
    }
    
    .info {
      background-color: #E8F0F8;
      border: 1px solid #4682B4;
      padding: 8px;
      margin: 10px 0;
      color: #003366;
    }
  </style>
</head>
<body>

<div class="header">
  <div class="container">
    <h1>Physics Education Laboratory</h1>
    <p>Interactive Simulations and Tools</p>
  </div>
</div>

<div class="container">
  <div class="breadcrumb">
    <a href="#">Home</a> &gt; 
    <a href="#">Simulations</a> &gt; 
    <a href="#">Mechanics</a> &gt; 
    <strong>Pendulum</strong>
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td width="200" valign="top" bgcolor="#B0C4DE" style="padding: 0;">
        <div class="nav-header">Navigation</div>
        <div class="nav-content">
          <a href="#">Home</a>
          <a href="#">Mechanics</a>
          <a href="#">Waves</a>
          <a href="#">Electricity</a>
          <a href="#">Thermodynamics</a>
          <hr style="margin: 6px 0;">
          <a href="#">Documentation</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </div>
      </td>
      <td width="600" valign="top" style="padding: 15px;">
        <h1>Pendulum Simulation</h1>
        
        <div class="info">
          <strong>Interactive Tool:</strong> Adjust parameters below to see how they affect 
          pendulum motion in real time.
        </div>
        
        <div class="panel">
          <div class="panel-header">Parameters</div>
          <div class="panel-body">
            <label for="length">Pendulum Length (cm):</label>
            <input type="text" id="length" value="50" size="8">
            
            <label for="angle">Initial Angle (degrees):</label>
            <input type="text" id="angle" value="15" size="8">
            
            <label for="damping">Damping:</label>
            <select id="damping">
              <option>None</option>
              <option selected>Light</option>
              <option>Medium</option>
              <option>Heavy</option>
            </select>
            
            <br><br>
            <button onclick="alert('Simulation would start here')">Start Simulation</button>
            <button onclick="alert('Reset to defaults')">Reset</button>
          </div>
        </div>
        
        <h2>Simulation Display</h2>
        <div class="code">
          [Canvas or Flash animation would appear here]
        </div>
        
        <h2>Data Output</h2>
        <p>
          <strong>Period:</strong> 2.25 seconds<br>
          <strong>Frequency:</strong> 0.44 Hz<br>
          <strong>Max Velocity:</strong> 1.23 m/s
        </p>
        
        <h2>About This Tool</h2>
        <p>
          This simulation demonstrates the behavior of a simple pendulum. 
          The period of oscillation depends on the length and local gravitational acceleration.
        </p>
        
        <div class="warning">
          <strong>Note:</strong> This simulation assumes no air resistance unless damping is enabled.
        </div>
      </td>
    </tr>
  </table>
</div>

<div class="footer">
  <p>
    Physics Education Laboratory © 2005 | Last Updated: April 15, 2005<br>
    <a href="mailto:help@physics.edu">Contact Support</a> | 
    <a href="#">Disclaimer</a>
  </p>
</div>

</body>
</html>
```

---

## Key CSS Properties for 2000s Aesthetic

### Essential Beveled Border Technique
```css
/* Outset (raised) */
border: 2px outset #DFDFDF;

/* Inset (pressed/sunken) */
border: 2px inset #808080;

/* Manual beveling - most authentic */
border-top: 1px solid #FFFFFF;
border-left: 1px solid #FFFFFF;
border-bottom: 1px solid #808080;
border-right: 1px solid #808080;
```

### Common Width/Size Constraints
- Page container: `width: 800px;` (optimized for 1024x768)
- Sidebar: `width: 180px;` to `200px;`
- Main content: remaining space
- Button padding: `4px 12px;` (compact, functional)
- Standard margins: `5px` to `15px;`

### Fonts
```css
/* Body text - most readable */
font-family: Verdana, Tahoma, Arial, sans-serif;
font-size: 12px;

/* Headers - imposing but readable */
font-family: Tahoma, Arial, sans-serif;
font-size: 18px;
font-weight: bold;

/* Code/technical - monospace */
font-family: 'Courier New', monospace;
font-size: 11px;
```

---

## Official Resources

- [Web Design Museum – 2000s Era Collection](https://www.webdesignmuseum.org/)
- [Frutiger Aero Aesthetics Overview](https://en.wikipedia.org/wiki/Frutiger_Aero)
- [Windows XP Visual Guidelines](http://interface.free.fr/Archives/GUI_Xp.pdf)
- [Verdana Typography History](https://neosmart.net/blog/tahoma-vs-verdana/)
- [Tahoma Font Reference](https://en.wikipedia.org/wiki/Tahoma_(typeface))
- [PhET Interactive Simulations (Active Project from 2002)](https://phet.colorado.edu/)
- [History of Web Design – 1990s-2000s](https://blog.hubspot.com/marketing/look-back-20-years-web-design)
- [Early 2000s Educational Design Examples](https://www.webdesignmuseum.org/css-layout-pioneers)

---

## Implementation Tips

1. **Use tables for layout** - embrace the era; avoid CSS Grid and Flexbox
2. **Beveled borders everywhere** - buttons, panels, boxes all need that 3D feel
3. **Solid colors only** - avoid modern gradients; use simple solid colors from the palette
4. **Small fonts** - 11px-12px was standard; don't go below 10px
5. **Underlined links** - always; text-decoration is sacred here
6. **Narrow container** - stick to 760-800px width
7. **Steel blue accents** - use #4682B4 liberally for headers and important UI
8. **No rounded corners** - keep everything angular; border-radius didn't exist yet
9. **Visited link color** - purple (#800080) marks previously clicked links
10. **Hover effects** - simple color change or background highlight, no transitions

