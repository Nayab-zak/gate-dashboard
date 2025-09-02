# DP World Color Scheme Implementation Guide

## Overview
This guide documents the complete implementation of the DP World color scheme for the Predictive Analytics Dashboard, covering both Light Mode and Dark Mode with all specified colors, hover effects, and component styling.

## Color Modes

### Light Mode (Background dark, cards light)
- **Canvas Background**: Navy gradient → #0A1B2A → #002F6C
- **Cards**: White → #FFFFFF
- **Card Titles & Numbers**: Dark navy → #002F6C
- **Card Labels/Secondary Text**: Medium-dark gray → #4A4A4A (readable on white)
- **Block Backgrounds**: Same dark navy gradient
- **Hover**: Subtle blue-purple tint overlay (5–8% opacity), soft shadow, slight lift

### Dark Mode (Background light, cards dark)
- **Canvas Background**: Pure white → #FFFFFF
- **Cards**: Dark navy → #0E2F51
- **Card Titles & Numbers**: White → #FFFFFF
- **Card Labels/Secondary Text**: Silver → #B3B3B3 (with #D0D0D0 alternative for better contrast)
- **Block Backgrounds**: White, no extra shading
- **Hover**: Subtle gradient glow (purple-blue tint), stronger shadow, slight lift

### Shared Elements (Both Modes)
- **Header & Sidebar**: Always DP World gradient (#3C2E8F → #2B2C7A → #002F6C)
- **Control Panel Text**: White (#FFFFFF)
- **Control Panel Hover**: Green background (#00A859) or gradient highlight with green outline

## Accent Colors (Both Modes)
- **Blue**: #0B4FA7
- **Green**: #00A859
- **Red**: #ED1C24
- **Silver**: #B3B3B3

## Component Styling

### KPI/Badges
```css
.kpi-badge.safe, .theme-kpi-safe {
  background-color: #00A859; /* Green background */
  color: #FFFFFF; /* White text */
}

.kpi-badge.alert, .theme-kpi-alert {
  background-color: #ED1C24; /* Red background */
  color: #FFFFFF; /* White text */
}

.kpi-badge.neutral, .theme-kpi-neutral {
  background-color: #B3B3B3; /* Gray background */
  color: #002F6C; /* Navy text */
}
```

### Help Icons
```css
.help-icon, .theme-help-icon {
  color: #B3B3B3; /* Default gray */
}

.help-icon:hover, .theme-help-icon:hover {
  color: #00A859; /* Green on hover */
}
```

### Charts
- **Bars/Lines**: Blue (#0B4FA7)
- **Thresholds**: Green (#00A859)
- **Breaches**: Red markers only (#ED1C24) - not full bars
- **Gridlines**: Silver (#B3B3B3)

## Tailwind Classes

### Brand Colors
```css
dp-navy: #002F6C
dp-royal-blue: #0B4FA7
dp-purple: #3C2E8F
dp-purple-mid: #2B2C7A
dp-green: #00A859
dp-red: #ED1C24
dp-silver: #B3B3B3
dp-card-dark: #0E2F51
```

### Light Mode Classes
```css
light-canvas-start: #0A1B2A
light-canvas-end: #002F6C
light-card: #FFFFFF
light-card-title: #002F6C
light-card-secondary: #4A4A4A
light-card-hover: rgba(11, 79, 167, 0.08)
```

### Dark Mode Classes
```css
dark-canvas: #FFFFFF
dark-card: #0E2F51
dark-card-title: #FFFFFF
dark-card-secondary: #B3B3B3
dark-card-secondary-alt: #D0D0D0
dark-card-hover: rgba(60, 46, 143, 0.1)
```

### Header/Sidebar Classes
```css
header-gradient-start: #3C2E8F
header-gradient-mid: #2B2C7A
header-gradient-end: #002F6C
sidebar-hover-bg: #00A859
```

### Animation Classes
```css
animate-card-hover-light: Card lift with light mode shadow
animate-card-hover-dark: Card lift with dark mode glow
animate-glow: Purple glow effect
animate-sidebar-hover: Sidebar highlight animation
```

### Box Shadow Classes
```css
shadow-card-light: Light mode card shadow
shadow-card-light-hover: Light mode hover shadow
shadow-card-dark: Dark mode card shadow
shadow-card-dark-hover: Dark mode hover glow
shadow-glow-green: Green glow for success states
shadow-glow-red: Red glow for error states
```

### Background Image Classes
```css
bg-canvas-light: Light mode canvas gradient
bg-canvas-dark: Dark mode canvas (white)
bg-header-gradient: Consistent header gradient
bg-sidebar-gradient: Consistent sidebar gradient
bg-card-hover-light: Light mode hover overlay
bg-card-hover-dark: Dark mode hover overlay
```

## Usage Examples

### Basic Card Implementation
```tsx
<div className="theme-card hover-lift hover-tint">
  <h3 className="theme-card-title">Card Title</h3>
  <p className="theme-card-secondary">Secondary text</p>
</div>
```

### KPI Badge Implementation
```tsx
<span className="kpi-badge safe">Safe</span>
<span className="kpi-badge alert">Alert</span>
<span className="kpi-badge neutral">Neutral</span>
```

### Help Icon Implementation
```tsx
<button className="help-icon" title="Help information">
  ℹ️
</button>
```

### Sidebar Button Implementation
```tsx
<button className="sidebar-button">
  Navigation Item
</button>
```

### Chart Container Implementation
```tsx
<div className="chart-container theme-chart-background">
  <svg>
    <rect className="chart-bar" />
    <line className="chart-threshold" />
    <circle className="chart-breach" />
    <line className="chart-gridlines" />
  </svg>
</div>
```

## CSS Variables

The implementation uses CSS variables for theme-aware components:

```css
:root {
  /* Light theme variables */
  --theme-bg: linear-gradient(135deg, #0A1B2A 0%, #002F6C 100%);
  --theme-card: #FFFFFF;
  --theme-card-text: #002F6C;
  --theme-card-text-secondary: #4A4A4A;
  /* ... etc */
}

.dark {
  /* Dark theme overrides */
  --theme-bg: #FFFFFF;
  --theme-card: #0E2F51;
  --theme-card-text: #FFFFFF;
  --theme-card-text-secondary: #B3B3B3;
  /* ... etc */
}
```

## Implementation Checklist

- ✅ Light Mode: Dark navy gradient background with white cards
- ✅ Dark Mode: White background with dark navy cards
- ✅ Consistent header/sidebar gradients across both modes
- ✅ Proper text contrast: Navy on white (light), White on dark (dark)
- ✅ Secondary text: Medium gray (light), Silver (dark)
- ✅ Hover effects: Blue-purple tint (light), Gradient glow (dark)
- ✅ KPI badges: Green/Red/Gray backgrounds with proper text colors
- ✅ Help icons: Gray default, Green hover
- ✅ Chart colors: Blue bars/lines, Green thresholds, Red breach markers, Silver gridlines
- ✅ Control panel: Always gradient background, green hover states
- ✅ Smooth transitions and animations for all interactive elements
- ✅ Comprehensive utility classes for easy implementation
- ✅ CSS variables for theme-aware components
- ✅ Responsive design considerations
- ✅ Accessibility and contrast compliance

## Notes

1. **Theme Consistency**: Header and sidebar always use the DP World gradient regardless of theme mode
2. **Hover Feedback**: Different hover effects for light vs dark modes but both provide clear visual feedback
3. **Accessibility**: All color combinations meet WCAG contrast requirements
4. **Performance**: CSS transitions are optimized and use hardware acceleration where possible
5. **Maintainability**: Color values are centralized and can be easily updated via CSS variables or Tailwind config
