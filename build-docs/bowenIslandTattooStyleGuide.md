# Bowen Island Tattoo Shop – UI Style Guide

> Stack: Next.js | TypeScript | Tailwind CSS v4 | DaisyUI  
> Aesthetic: **Victorian Gothic** meets **Modern Minimalism**  
> Color Base: **White** (background), **Obsidian Black**, **Gold**, **Slate Gray**

---

## 🖤 Design Philosophy

A clean white canvas that evokes an art gallery, layered with rich gothic accents.  
This balance of clarity and ornamentation reflects the brand: **symbolic, curated, and personal**.

---

## 🎨 Color Palette

| Name               | Hex        | Usage                            |
|--------------------|------------|----------------------------------|
| **Obsidian Black** | `#080808`  | Primary text, nav, footer        |
| **White**          | `#FFFFFF`  | Background, form cards, layout   |
| **Antique Gold**   | `#C9A449`  | Accent text, buttons, icons      |
| **Slate Gray**     | `#444444`  | Borders, muted text, secondary   |

> Use gold sparingly to add sophistication. Obsidian for dominant typography. Slate for depth and hierarchy.

---

## 🖋 Typography

### Style Direction
- Gothic elegance with clean legibility
- Fonts evoke Victorian signage & vintage literature

### Fonts
- **Headings**:  
 `Cinzel`
- **Body**:  
  `Lora`

### Tailwind Config
```ts
fontFamily: {
  heading: ['"DM Serif Display"', 'serif'],
  body: ['"Inter"', 'sans-serif'],
}
