# 05 · UI/UX guidelines (HIG-derived)

Distilled from Apple's Human Interface Guidelines for Liquid Glass, translated into rules you can apply on the web with LiquidLens. When in doubt, remember the principle behind all of them:

> **Liquid Glass is the functional layer that floats above your content. It should clarify hierarchy, never compete with content for attention.**

## Core principles

### 1. It's a layer for controls, not for content

Use glass for the "chrome" that sits above your app — navigation and tab bars, toolbars, sidebars, floating action buttons, Control-Center-style panels, alerts, sliders, notifications. Keep the underlying content (articles, feeds, media, canvases) **opaque and legible**. Do not render body content on glass.

### 2. Hierarchy through depth

Glass separates the interactive layer from content via lensing plus shadow. Use it to signal "this floats above." Avoid stacking many glass layers on top of one another — Apple explicitly warns against **glass-on-glass**; it muddies depth cues and hurts legibility. One clear glass layer over content reads best.

### 3. Legibility is non-negotiable

The entire point of the adaptive shadow and tone is readability. On the web you must guarantee it yourself: keep text high-contrast, keep `blur` modest, and if content sits on a busy background use **Regular** (self-legible) or add a scrim. Test light *and* dark, plain *and* busy backgrounds. See **[09 · Accessibility](09-accessibility.md)**.

### 4. Restraint

Apple uses glass sparingly, on the most important, most-floating controls. Applying it to everything flattens the very hierarchy it is meant to create — and tanks performance. Pick the few surfaces that genuinely float.

### 5. Consistency & harmony

Match corner radii to Apple's concentric squircle feel, keep specular and tint consistent across a screen, and let elements share one light direction so highlights agree. Because LiquidLens drives the highlight from a single global pointer position, all panes on a page already illuminate in unison.

## Motion & interaction

- **Illuminate on touch.** Interactive glass should brighten and glow from underneath on press — `.lg-press` does this (`:active` re-centers and intensifies the specular highlight). It is the primary feedback that a glass control is live.
- **Morph, don't cut.** Transitions should feel liquid — elements stretch, merge, and reflow rather than hard-swapping. On the web, animate `transform` and size with springy easing (LiquidLens ships `--lg-ease: cubic-bezier(.2,1,.3,1)`), and let nearby controls' highlights react together. The `.lg-morph` container helps group elements that should flow as one.
- **Highlights track motion.** Specular glints slide with device tilt or the pointer. Subtle is the target; a jittery or too-bright highlight looks cheap.
- **Respect reduced-motion.** Gate morph and highlight animation behind `prefers-reduced-motion` (the CSS already freezes transitions there).

## Accessibility (do not skip)

- Honor **`prefers-reduced-transparency`** → fall back to a solid, opaque surface. The CSS does this, and the engine additionally skips all GPU map-generation work in this mode.
- Honor **`prefers-reduced-motion`** → freeze highlight and morph animation.
- Honor **`prefers-contrast: more`** → the CSS adds a crisp 1px inner border for definition.
- Maintain **WCAG contrast** for text *on the composited result*, not on the tint alone. Blurred bright backgrounds can drop effective contrast below AA — verify against the real backdrop.
- Don't encode meaning in the glass effect alone; keep labels and icons clear.
- Ensure focus rings and hit targets stay visible against the translucent surface.

Full detail in **[09 · Accessibility](09-accessibility.md)**.

## Do / Don't

| Do | Don't |
|---|---|
| Use glass for floating controls over content | Put paragraphs of body text on glass |
| One glass layer above content | Stack glass on glass on glass |
| Keep blur low so refraction shows | Crank blur until it's an opaque frosted slab |
| Subtle tint (≤ ~0.15 alpha) | Heavy tint that becomes a colored card |
| Regular by default; Clear only over bright media | Clear over text or plain backgrounds |
| Test light/dark + busy/plain + reduced-transparency | Ship after testing one background only |
| Provide an opaque fallback | Assume every browser shows refraction |

## Sizing & shape

- Corner radius should feel **concentric** with what it contains and with the screen — larger panes get larger radii. Squircle-ish radii match Apple best. Keep `--lg-radius` in sync with the visual radius, because the engine reads it to build the displacement map.
- Keep the **bezel** proportional to the element. A 22px bezel on a 54px toggle is fine; the engine clamps the bezel to less than half the smallest dimension, so tiny controls never over-refract into mush.

## Sources

- Apple Human Interface Guidelines — Materials: https://developer.apple.com/design/human-interface-guidelines/materials
- WWDC25 — *Meet Liquid Glass*: https://developer.apple.com/videos/play/wwdc2025/219/
- Create with Swift — hierarchy, harmony, consistency: https://www.createwithswift.com/liquid-glass-redefining-design-through-hierarchy-harmony-and-consistency/
