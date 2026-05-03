# Early 2000s Academic Web Style Guide

Reference for recreating the aesthetic of university/educational interactive tools circa 1999–2005.
Target: Windows XP era, Internet Explorer 6, 800×600 or 1024×768 screen resolution.

---

## Color Palette

### Page & Layout

| Role                     | Hex       | Name              |
|--------------------------|-----------|-------------------|
| Page background          | `#C0C0C0` | Silver            |
| Content area background  | `#F0F0F0` | Light gray        |
| Panel background         | `#E8E8E8` | Panel gray        |
| Navbar / footer bar      | `#D4D4D4` | Medium gray       |

### Accent & Headers

| Role                     | Hex       | Name              |
|--------------------------|-----------|-------------------|
| Header gradient start    | `#000080` | Navy              |
| Header gradient end      | `#4169E1` | Royal blue        |
| Section header bg        | `#000080` | Navy              |
| Section header text      | `#FFFFFF` | White             |
| Highlight / warning text | `#FFFF99` | Pale yellow       |

### Text & Links

| Role                     | Hex       | Name              |
|--------------------------|-----------|-------------------|
| Body text                | `#000000` | Black             |
| Label / heading text     | `#000080` | Navy              |
| Unvisited links          | `#0000CC` | Blue              |
| Visited links            | `#800080` | Purple            |
| Hover links              | `#FF0000` | Red               |
| Muted / secondary text   | `#555555` | Dark gray         |

### UI Controls

| Role                     | Hex       | Name              |
|--------------------------|-----------|-------------------|
| Value readout box        | `#FFFFCC` | Pale yellow       |
| Value box border         | `#999999` | Mid gray          |
| Button / slider bg       | `#D4D4D4` | Medium gray       |
| Border highlight edge    | `#DFDFDF` | Near-white        |
| Border shadow edge       | `#808080` | Mid gray          |

### Regime / Status Tags

| Regime             | Hex       |
|--------------------|-----------|
| Underdamped (red)  | `#CC0000` |
| Critical (orange)  | `#E68A00` |
| Overdamped (blue)  | `#003399` |

---

## Typography

### Font Stacks

```css
/* Body */
font-family: Verdana, Geneva, sans-serif;
font-size: 11px;

/* Headers and labels */
font-family: Tahoma, Arial, sans-serif;
font-weight: bold;
font-size: 12px;

/* Equations and monospace values */
font-family: "Courier New", Courier, monospace;
font-size: 11px–13px;
```

### Sizing Scale

| Use                  | Size  | Face       |
|----------------------|-------|------------|
| Page banner h1       | 22px  | Tahoma     |
| Section headers      | 12px  | Tahoma     |
| Body / panel text    | 11px  | Verdana    |
| Small / caption      | 10px  | Verdana    |
| Navbar / footer      | 10px  | Tahoma     |
| Equations (inline)   | 13px  | Courier    |
| Value boxes          | 11px  | Courier    |
| Axis labels (canvas) | 10–11px | Tahoma  |

### Authentic HTML Tags (era-appropriate)

```html
<font face="Tahoma" size="2"><b>Section Label</b></font>
<font face="Verdana" size="1">Small caption text</font>
<font face="Courier New" size="2">0.000</font>
```

Use `<font>` sparingly for ambiance; pair with CSS for real layout control.

---

## Layout

### Page Structure

```html
<div class="pageWrap">  <!-- 800px wide, centered, outset border -->
  <div class="banner">  <!-- navy gradient header -->
  <div class="navbar">  <!-- gray link bar -->
  <div class="sectionHeader"> <!-- navy bar, white text -->
  <div class="panel">   <!-- beveled inset content area -->
  <div class="footer">  <!-- gray, centered, small text -->
</div>
```

### Table-Based Grid (no flexbox, no grid)

```html
<table border="0" cellpadding="4" cellspacing="2" width="100%">
  <tr>
    <td width="50%" valign="top">Left column</td>
    <td width="50%" valign="top">Right column</td>
  </tr>
</table>
```

Fixed page width: **800px** centered with `margin: 0 auto`.

---

## CSS Patterns

### Page Wrapper

```css
.pageWrap {
  width: 800px;
  margin: 0 auto;
  background-color: #F0F0F0;
  border: 2px outset #DFDFDF;
}
```

### Background Tile (Silver Checker)

```css
body {
  background-color: #C0C0C0;
  background-image:
    linear-gradient(45deg,  #B8B8B8 25%, transparent 25%),
    linear-gradient(-45deg, #B8B8B8 25%, transparent 25%),
    linear-gradient(45deg,  transparent 75%, #B8B8B8 75%),
    linear-gradient(-45deg, transparent 75%, #B8B8B8 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
}
```

### Banner (Navy Gradient)

```css
.banner {
  background: #000080;
  background: linear-gradient(to right, #000080 0%, #4169E1 100%);
  color: #FFFFFF;
  padding: 12px 14px;
  border-bottom: 2px solid #000050;
}
.banner h1 {
  font-family: Tahoma, Arial, sans-serif;
  font-size: 22px;
  font-weight: bold;
  font-style: italic;
  color: #FFFFFF;
  text-shadow: 1px 1px 0 #000040;
  letter-spacing: 1px;
  margin: 0;
}
```

### Section Header Bar

```css
.sectionHeader {
  background-color: #000080;
  color: #FFFFFF;
  font-family: Tahoma, Arial, sans-serif;
  font-weight: bold;
  font-size: 12px;
  padding: 4px 8px;
  border-top: 1px solid #4169E1;
  border-bottom: 1px solid #000040;
}
```

Prefix section titles with `»` (`&raquo;`) for the authentic nav-arrow look.

### Panel (Beveled Inset Box)

```css
.panel {
  background-color: #E8E8E8;
  border: 2px inset #DFDFDF;
  padding: 8px;
  margin: 6px;
}
```

### Beveled HR Divider

```css
hr.beveled {
  height: 0;
  border: 0;
  border-top: 1px solid #808080;
  border-bottom: 1px solid #FFFFFF;
  margin: 8px 0;
}
```

### Button

```css
button {
  border: 2px outset #DFDFDF;
  background: #D4D4D4;
  font-family: Tahoma, Arial, sans-serif;
  font-size: 11px;
  padding: 2px 10px;
  cursor: pointer;
}
button:active { border-style: inset; }
```

### Windows-Style Range Slider

```css
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 260px;
  height: 18px;
  background: #D4D4D4;
  border: 2px inset #DFDFDF;
  padding: 2px;
  vertical-align: middle;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 18px;
  background: #D4D4D4;
  border: 2px outset #DFDFDF;
  cursor: pointer;
}
```

### Value Readout Box (Pale Yellow)

```css
.valueBox {
  background-color: #FFFFCC;
  border: 1px solid #999999;
  padding: 1px 6px;
  font-family: "Courier New", Courier, monospace;
  font-size: 11px;
  display: inline-block;
  min-width: 56px;
  text-align: right;
}
```

### Blinking Text

```css
.blink { animation: blink 1s steps(2, start) infinite; }
@keyframes blink { to { visibility: hidden; } }
```

### Under-Construction Stripe

```css
.underConstruction {
  height: 14px;
  background: repeating-linear-gradient(
    45deg,
    #FFCC00 0 12px,
    #000000 12px 24px
  );
  border-top: 1px solid #808080;
  border-bottom: 1px solid #808080;
}
```

### Hit Counter (Green on Black)

```css
.hitcounter {
  display: inline-block;
  background: #000000;
  color: #00FF00;
  font-family: "Courier New", Courier, monospace;
  font-size: 13px;
  padding: 2px 6px;
  border: 2px inset #555555;
  letter-spacing: 2px;
}
```

---

## HTML Fraction Rendering (No MathJax)

```html
<table style="display:inline-table; text-align:center; vertical-align:middle;
              font-family:'Courier New',Courier,monospace; font-size:13px;">
  <tr><td style="border-bottom:2px solid #000; padding:2px 8px;">numerator</td></tr>
  <tr><td style="padding:2px 8px;">denominator</td></tr>
</table>
```

Use `vertical-align: middle` on surrounding inline elements to align the fraction with text.

---

## Canvas / Plot Conventions

- Canvas background: `#FFFFFF`, border: `2px inset #DFDFDF`
- Grid lines: `#E0E0E0`, 1px
- Axis lines: `#000000`, 1px
- Axis labels: `#000080` bold Tahoma 10–11px
- Tick labels: `#333333` Verdana 9px
- Dashed lines: `setLineDash([4,3])` for reference lines
- Annotation text: bold Tahoma 10px

---

## Decorative Flourishes

- Page title: bold italic with `text-shadow: 1px 1px 0 #000040`
- Section titles prefixed with `»` (`&raquo;`)
- Blinking `<span class="blink" style="color:#FFFF00;">NEW!</span>` in banner
- Under-construction stripe between sections
- Footer includes:
  - "Best viewed in Internet Explorer 6.0 at 1024×768"
  - "Last updated: [Month Day, Year]"  ← use a plausible early-2000s date
  - Hit counter: `Visitors: 00004271`
  - Copyright line: `© 200X Department of [X]. All rights reserved.`

---

## What to Avoid

- `border-radius` — didn't exist / wasn't supported
- `box-shadow` — use `border: 2px outset/inset` instead
- `flexbox` / `display: grid` — use `<table>` for layout
- Web fonts (Google Fonts, etc.) — stick to Verdana, Tahoma, Arial, Courier New
- Smooth gradients on buttons — flat or single-color only
- Rounded inputs — square everything
