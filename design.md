# Design System Strategy: The Intelligent Assessment Framework

## 1. Overview & Creative North Star
**Creative North Star: The Luminescent Curator**

This design system is engineered to feel less like a static testing tool and more like an evolving, living intelligence. In the "Future of Work" context, assessments should not feel punitive; they should feel enlightening. We move beyond the "boxed-in" feeling of traditional platforms by utilizing **Luminescent Layering**—a technique where elements seem to float on sheets of light and glass.

To break the "template" look, we prioritize **Intentional Asymmetry**. Significant data visualizations, like radar charts, are treated as editorial centerpieces rather than small widgets. We use high-contrast typography scales (large Manrope displays against precise Inter labels) to create a rhythm that feels both authoritative and high-tech.

---

## 2. Colors & Surface Philosophy

The color strategy focuses on a high-contrast relationship between a sterile, clinical background (`surface`) and "energy-filled" interactive accents (`primary` Indigo and `secondary` Violet).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning content. Boundaries must be defined solely through:
- **Background Color Shifts:** Use `surface-container-low` for sections sitting on top of the main `background`.
- **Tonal Transitions:** Define areas by nesting a `surface-container-lowest` card inside a `surface-container` area.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
1. **Base:** `background` (#f5f7f9) - The canvas.
2. **Zone:** `surface-container-low` (#eef1f3) - Use for large content areas or sidebars.
3. **Object:** `surface-container-lowest` (#ffffff) - Use for the "Main Card" or primary focus area.
4. **Interactive:** `primary-container` (#9c94ff) - Subtle highlights for active states.

### The Glass & Gradient Rule
To achieve the "Future of Work" vibe, floating elements (tooltips, chat bubbles, or mobile overlays) should utilize **Glassmorphism**:
- **Background:** Semi-transparent `surface` or `primary-container` (at 80% opacity).
- **Effect:** `backdrop-blur: 12px`.
- **CTAs:** Use a subtle linear gradient from `primary` (#5342d6) to `secondary` (#702ae1) at a 135-degree angle to provide "visual soul."

---

## 3. Typography

The typography system pairs the tech-forward, geometric personality of **Manrope** with the industrial-grade readability of **Inter**.

*   **Display & Headlines (Manrope):** Large, bold, and expressive. Used for assessment titles, score summaries, and section headers. This conveys a sense of high-end editorial quality.
*   **Body & Titles (Inter):** Highly legible. Used for assessment questions, report descriptions, and dashboard labels.
*   **Labels (Inter):** Small, caps or semi-bold. Used for data visualization markers (e.g., radar chart axis titles) and metadata.

**Hierarchy Goal:** A `display-lg` score should clearly dominate the page, while `body-sm` metadata provides a professional, "dense-information" feel without cluttering the view.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through "Tonal Layering." For example, an assessment card (`surface-container-lowest`) placed on a workspace background (`surface`) creates a soft, natural lift without the need for heavy shadows.

### Ambient Shadows
When an element must "float" (like a radar chart tooltip or a chat popup):
- **Blur:** 24px to 40px.
- **Opacity:** 4% - 8% of the `on-surface` color.
- **Color:** Tint the shadow with a hint of `primary` to mimic natural, ambient light bouncing off the vibrant UI elements.

### The "Ghost Border" Fallback
If accessibility requires a container boundary, use a **Ghost Border**:
- **Stroke:** 1px.
- **Token:** `outline-variant` (#abadaf) at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Cards & Assessment Modules
*   **Rule:** Forbid divider lines within cards. 
*   **Implementation:** Separate the "Question" from "Answer options" using 24px of vertical white space or a subtle shift to `surface-container-highest` for the active selection area.
*   **Rounding:** Use `xl` (1.5rem) for main cards to feel approachable and modern.

### Data Visualization (Radars & Progress)
*   **Radar Charts:** Use `primary` and `secondary` with 30% fill opacity for overlapping skill areas. The center-point should feature a high-resolution user avatar.
*   **Progress Bars:** Use a thick `secondary-container` (#dcc9ff) track with a `primary` (#5342d6) indicator. Avoid rounded ends for a more "precise/technical" feel; use `sm` (0.25rem) rounding instead.

### Chat Interface
*   **User Bubbles:** `primary` background with `on-primary` text.
*   **AI/System Bubbles:** `surface-container-high` background with `on-surface` text. Use a 12px backdrop blur if the chat is an overlay.

### Interactive Toggles & Chips
*   **Selection Chips:** Use `secondary-fixed` for unselected and `primary` for selected. 
*   **Toggles:** High-contrast `primary` tracks with a `surface` thumb to ensure the "On" state feels powered-on.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. If a radar chart is on the left, let the text on the right vary in line length to create a dynamic "sculpted" feel.
*   **Do** use `primary-fixed-dim` for inactive but important states to maintain color harmony without overwhelming the user.
*   **Do** ensure all text on `primary` or `secondary` backgrounds uses `on-primary` (#f5f0ff) for maximum AA-grade accessibility.

### Don't
*   **Don't** use 1px grey lines to separate list items. Use 12px–16px of white space instead.
*   **Don't** use pure black (#000000) for text. Use `on-surface` (#2c2f31) to maintain a premium, softer contrast.
*   **Don't** use "Drop Shadows" from standard software presets. Always customize the blur and opacity to create the "Ambient Light" effect.
*   **Don't** overcrowd the data visualizations. Give the radar chart at least 40px of breathing room on all sides.
