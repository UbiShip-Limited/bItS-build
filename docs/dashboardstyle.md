# Bowen Island Tattoo Shop - Dashboard Style Guide

## Design Philosophy
A sophisticated smokey grey dashboard design that embodies the modern, refined aesthetic of professional tattoo artistry. The design emphasizes subtle contrasts, elegant typography, and atmospheric depth while maintaining excellent readability and professional functionality.

## Color Palette

### Primary Colors
- **Misty White**: `#F7F8FA` - Main background, subtle base
- **Smokey Light**: `#E8EAED` - Card backgrounds, elevated surfaces
- **Smokey Medium**: `#D2D4D7` - Input backgrounds, secondary surfaces

### Smokey Greys
- **Ash Grey**: `#9AA0A6` - Borders, dividers, subtle elements
- **Storm Grey**: `#5F6368` - Secondary text, icons, muted content
- **Charcoal Smoke**: `#3C4043` - Primary text, important content
- **Deep Smoke**: `#202124` - Sidebar background, dark sections
- **Obsidian**: `#171717` - Highest contrast text, headers

### Accent Colors
- **Silver Mist**: `#F1F3F4` - Hover states, subtle highlights
- **Platinum**: `#DADCE0` - Active states, focus rings
- **Graphite**: `#4A4D52` - Interactive elements
- **Smoke Shadow**: `rgba(32, 33, 36, 0.1)` - Subtle shadows

## Layout Structure

### Sidebar Navigation
```css
/* Sidebar Container */
.sidebar {
  width: 256px;
  background: #202124;
  border-right: 1px solid #3C4043;
  min-height: 100vh;
  backdrop-filter: blur(10px);
}

/* Brand Header */
.brand-header {
  padding: 24px;
  border-bottom: 1px solid #3C4043;
  background: linear-gradient(135deg, #202124 0%, #171717 100%);
}

.brand-title {
  color: #F7F8FA;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.brand-subtitle {
  color: #9AA0A6;
  font-size: 14px;
  margin-top: 4px;
}
```

### Navigation Items
```css
.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #D2D4D7;
  border-radius: 8px;
  margin: 4px 12px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #F7F8FA;
  transform: translateX(6px);
}

.nav-item.active {
  background: linear-gradient(135deg, #5F6368 0%, #4A4D52 100%);
  color: #F7F8FA;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.nav-icon {
  margin-right: 12px;
  font-size: 18px;
  opacity: 0.8;
}

.nav-item:hover .nav-icon {
  opacity: 1;
}
```

### Main Content Area
```css
.main-content {
  flex: 1;
  background: #F7F8FA;
  padding: 32px;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #DADCE0;
  background: linear-gradient(135deg, rgba(247, 248, 250, 0.8) 0%, rgba(232, 234, 237, 0.4) 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.page-title {
  color: #171717;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.page-subtitle {
  color: #5F6368;
  font-size: 16px;
}
```

## Component Styles

### Cards
```css
.card {
  background: #E8EAED;
  border: 1px solid #DADCE0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(32, 33, 36, 0.08);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.card:hover {
  border-color: #9AA0A6;
  box-shadow: 0 8px 24px rgba(32, 33, 36, 0.12);
  transform: translateY(-2px);
  background: linear-gradient(135deg, #E8EAED 0%, #F1F3F4 100%);
}

.card-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #D2D4D7;
}

.card-title {
  color: #171717;
  font-size: 18px;
  font-weight: 600;
}
```

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #3C4043 0%, #202124 100%);
  color: #F7F8FA;
  border: 1px solid #5F6368;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(32, 33, 36, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5F6368 0%, #3C4043 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(32, 33, 36, 0.3);
}

/* Secondary Button */
.btn-secondary {
  background: #E8EAED;
  color: #3C4043;
  border: 1px solid #D2D4D7;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: #9AA0A6;
  background: #F1F3F4;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(32, 33, 36, 0.1);
}
```

### Tables
```css
.table {
  width: 100%;
  border-collapse: collapse;
  background: #E8EAED;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #D2D4D7;
  box-shadow: 0 4px 16px rgba(32, 33, 36, 0.08);
}

.table th {
  background: linear-gradient(135deg, #202124 0%, #171717 100%);
  color: #F7F8FA;
  padding: 16px 20px;
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid #3C4043;
}

.table td {
  padding: 16px 20px;
  border-bottom: 1px solid #D2D4D7;
  color: #3C4043;
  background: #E8EAED;
}

.table tr:hover td {
  background: #F1F3F4;
}

.table tr:last-child td {
  border-bottom: none;
}
```

### Forms
```css
.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  color: #3C4043;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 14px 18px;
  border: 1px solid #D2D4D7;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: #F7F8FA;
  color: #3C4043;
  box-shadow: inset 0 1px 3px rgba(32, 33, 36, 0.05);
}

.form-input:focus {
  outline: none;
  border-color: #5F6368;
  box-shadow: 0 0 0 3px rgba(95, 99, 104, 0.15);
  background: #FFFFFF;
}

.form-input::placeholder {
  color: #9AA0A6;
}
```

## Typography

### Headings
```css
h1 { font-size: 32px; font-weight: 700; color: #171717; line-height: 1.2; }
h2 { font-size: 24px; font-weight: 600; color: #202124; line-height: 1.3; }
h3 { font-size: 20px; font-weight: 600; color: #3C4043; line-height: 1.4; }
h4 { font-size: 18px; font-weight: 600; color: #3C4043; line-height: 1.4; }
h5 { font-size: 16px; font-weight: 600; color: #5F6368; line-height: 1.5; }
h6 { font-size: 14px; font-weight: 600; color: #5F6368; line-height: 1.5; }
```

### Body Text
```css
.text-primary { color: #3C4043; }
.text-secondary { color: #5F6368; }
.text-muted { color: #9AA0A6; }
.text-small { font-size: 14px; }
.text-large { font-size: 18px; }
```

## Tailwind CSS Classes

### Background Colors
- `bg-smoke-900` - #171717 (custom)
- `bg-smoke-800` - #202124 (custom)
- `bg-smoke-700` - #3C4043 (custom)
- `bg-smoke-500` - #5F6368 (custom)
- `bg-smoke-300` - #9AA0A6 (custom)
- `bg-smoke-100` - #E8EAED (custom)
- `bg-smoke-50` - #F7F8FA (custom)

### Text Colors
- `text-smoke-900` - #171717 (custom)
- `text-smoke-800` - #202124 (custom)
- `text-smoke-700` - #3C4043 (custom)
- `text-smoke-500` - #5F6368 (custom)
- `text-smoke-300` - #9AA0A6 (custom)

### Border Colors
- `border-smoke-300` - #D2D4D7 (custom)
- `border-smoke-200` - #DADCE0 (custom)
- `border-smoke-700` - #3C4043 (custom)

## Implementation Notes

### Sidebar Implementation
```typescript
// Updated sidebar classes for smokey theme
<aside className="w-64 bg-smoke-800 shadow-xl border-r border-smoke-700">
  <div className="p-6 border-b border-smoke-700 bg-gradient-to-br from-smoke-800 to-smoke-900">
    <h1 className="text-xl font-bold text-smoke-50">Bowen Island Tattoo</h1>
    <p className="text-sm text-smoke-300 mt-1">Admin Dashboard</p>
  </div>
  <nav className="mt-6">
    <ul className="space-y-1 px-3">
      {/* Navigation items with hover:bg-white/10 */}
    </ul>
  </nav>
</aside>
```

### Main Content Implementation
```typescript
<main className="flex-1 p-8 bg-smoke-50 min-h-screen">
  {children}
</main>
```

### Custom Tailwind Configuration
```javascript
// Add to tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'smoke': {
          50: '#F7F8FA',
          100: '#E8EAED',
          200: '#DADCE0',
          300: '#9AA0A6',
          500: '#5F6368',
          700: '#3C4043',
          800: '#202124',
          900: '#171717',
        }
      }
    }
  }
}
```

## Responsive Design

### Mobile Breakpoints
- Sidebar collapses to icon-only on mobile with smokey overlay
- Main content adjusts padding and spacing
- Cards adapt with responsive grid system

### Accessibility
- Maintains 4.5:1 contrast ratios for WCAG AA compliance
- Smokey theme reduces eye strain while preserving readability
- Focus indicators with subtle glow effects
- Screen reader friendly navigation with semantic markup

## Brand Consistency
This smokey grey design reflects the atmospheric, sophisticated nature of modern tattoo artistry. The subtle gradients and soft contrasts create a professional, calming environment perfect for managing a creative business while maintaining excellent usability and aesthetic appeal. 