# Bowen Island Tattoo Shop - Dashboard Dark Theme Style Guide

## Design Philosophy
A sophisticated, modern dark theme that embodies the Victorian Gothic aesthetic while maintaining excellent usability. The design emphasizes sleek contrasts, elegant typography, and atmospheric depth with gold accents that reflect the brand's premium positioning.

## Color Palette

### Primary Colors
- **Obsidian Black**: `#080808` - Primary background, headers
- **Deep Black**: `#0a0a0a` - Secondary background
- **Card Black**: `#111111` - Card backgrounds, elevated surfaces
- **Border Dark**: `#1a1a1a` - Borders, dividers

### Accent Colors
- **Antique Gold**: `#C9A449` - Primary accent, links, highlights
- **Gold Hover**: `#B8934A` - Hover state for gold elements
- **Gold Muted**: `#8B7635` - Secondary gold tone

### Text Colors
- **White**: `#FFFFFF` - Primary text, headings
- **Gray 300**: `#D1D5DB` - Body text on dark
- **Gray 400**: `#9CA3AF` - Secondary text, labels
- **Gray 500**: `#6B7280` - Muted text, descriptions

### Status Colors
- **Success**: Green with `bg-green-500/20`, `text-green-400`, `border-green-500/30`
- **Warning**: Gold with `bg-[#C9A449]/20`, `text-[#C9A449]`, `border-[#C9A449]/30`
- **Info**: Blue with `bg-blue-500/20`, `text-blue-400`, `border-blue-500/30`
- **Error**: Red with `bg-red-500/20`, `text-red-400`, `border-red-500/30`

## Component Styles

### Layout Structure
```css
/* Main Background */
.main-bg {
  background: #0a0a0a;
}

/* Sidebar */
.sidebar {
  background: #080808;
  border-right: 1px solid #1a1a1a;
  width: 288px; /* 72 in Tailwind units */
}
```

### Cards
```css
.card {
  background: #111111;
  border: 1px solid #1a1a1a;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(201, 164, 73, 0.2);
  box-shadow: 0 0 40px rgba(201, 164, 73, 0.1);
}
```

### Navigation
- Active state: Background with `#C9A449/10`, border `#C9A449/20`, text `#C9A449`
- Hover state: Background `white/5`, text white
- Gold accent line on active items

### Buttons
```css
/* Primary Button - Gold */
.btn-primary {
  background: #C9A449;
  color: #080808;
  transition: all 0.3s ease;
  box-shadow: 0 10px 15px -3px rgba(201, 164, 73, 0.2);
}

.btn-primary:hover {
  background: #B8934A;
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  border: 1px solid rgba(201, 164, 73, 0.3);
  color: #C9A449;
}

.btn-ghost:hover {
  background: rgba(201, 164, 73, 0.1);
  border-color: rgba(201, 164, 73, 0.5);
}
```

### Tables
```css
/* Table Header */
.table-header {
  background: #080808;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
}

/* Table Rows */
.table-row {
  border-bottom: 1px solid #1a1a1a;
}

.table-row:hover {
  background: rgba(26, 26, 26, 0.5);
}
```

### Status Badges
```css
.badge {
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border-width: 1px;
}
```

## Typography

### Font Usage
- **Headings**: Use `font-heading` class for brand consistency
- **Body**: Default sans-serif for readability
- **Uppercase**: Used sparingly for table headers and labels

### Text Hierarchy
- **Page Title**: `text-3xl font-bold text-white tracking-wide`
- **Section Title**: `text-2xl font-bold text-white`
- **Card Title**: `text-lg font-semibold text-white`
- **Body Text**: `text-gray-300`
- **Secondary Text**: `text-gray-400`
- **Muted Text**: `text-gray-500`

## Interactive States

### Hover Effects
- Cards: Subtle border glow with gold accent
- Navigation: Background lightness increase, text color change
- Buttons: Background color shift, shadow enhancement
- Table rows: Subtle background highlight

### Transitions
- All interactive elements use `transition-all duration-300`
- Smooth color transitions for hover states
- Transform effects for elevation changes

## Implementation Notes

### Accessibility
- Maintains WCAG AA contrast ratios
- Focus states with gold accent rings
- Clear hover indicators
- Semantic HTML structure

### Performance
- Uses CSS transitions instead of animations
- Backdrop filters used sparingly
- Optimized shadow usage

### Brand Consistency
The dark theme reinforces the Victorian Gothic aesthetic while providing a modern, professional interface for business management. The gold accents tie directly to the front-end branding while the dark backgrounds create focus and reduce eye strain during extended use. 