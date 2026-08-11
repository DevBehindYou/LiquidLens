# 01 · What is Liquid Glass

## Origin

Liquid Glass is the visual design language Apple introduced at **WWDC 2025** and shipped across **iOS 26, iPadOS 26, macOS 26 (Tahoe), watchOS 26, tvOS 26, and visionOS**. It is the most sweeping redesign of Apple's interface since iOS 7 in 2013. Its dimensional, depth-aware feel is drawn directly from **visionOS**, and it became practical thanks to advances in Apple's GPUs and real-time rendering.

Apple frames it this way:

> "Liquid Glass is a new **meta-material** that **simulates the optical qualities of physical glass while transcending its limitations.** It is translucent and behaves like glass in the real world. Its **color is informed by surrounding content** and **intelligently adapts between light and dark environments.**"

The word that matters there is *meta-material*: it is not a texture or a filter you drop on top of a design, but a system-level material with defined optical behavior that the OS composites in real time.

## The mental model

Think of a **pane of real, slightly curved glass floating a few millimeters above your content.** Every behavior of Liquid Glass follows from that one physical intuition:

- Light passing through the **curved edges bends** (refraction, or "lensing"), so the background looks slightly magnified and warped at the rim while the center stays clear.
- The surface catches **specular highlights** — bright glints that slide as the device tilts or the pointer moves.
- It sits above content, so it **casts a soft shadow** and separates the interactive layer from what's underneath.
- Being translucent, it **picks up the color** of whatever is behind it and **blurs** it.
- The system keeps it **legible** — deepening its shadow or shifting its tone over busy backgrounds so foreground text never washes out.

LiquidLens reproduces all five of these on the web. The rest of these docs explain exactly how.

## Liquid Glass ≠ Glassmorphism

This is the single most important distinction for an implementer. Glassmorphism (the frosted-card trend that peaked around 2020) delivers two behaviors: blur and tint. Liquid Glass delivers those **plus** the defining one — edge refraction — and layers motion and adaptivity on top.

| Property | Glassmorphism (2020) | Liquid Glass (2025) |
|---|:---:|:---:|
| Blur behind | ✅ | ✅ |
| Tint / translucency | ✅ | ✅ |
| **Edge refraction (lensing)** | ❌ | ✅ **defining trait** |
| Motion-reactive specular highlight | ❌ | ✅ |
| Chromatic edge (dispersion) | ❌ | ✅ |
| Adaptive legibility / shadow | rare | ✅ |
| Fluid morph on interaction | ❌ | ✅ |

If you build a frosted, blurred, tinted card and stop there, you have built glassmorphism. Liquid Glass *begins* at the edge refraction. See **[02 · Optics & Physics](02-optics-and-physics.md)** for how that bending is produced, and **[03 · Material Anatomy](03-material-anatomy.md)** for the full layer stack.

## Where Apple uses it

Liquid Glass is reserved for the floating controls and "chrome" that sit **above** content — never for the content itself. In Apple's own products that means:

- Navigation bars and tab bars
- Toolbars and sidebars
- Control Center and notifications
- Sliders, buttons, and menus
- The Dock and alerts

Apple's guidance is explicit that Liquid Glass is a **functional layer, not decoration**: use it for the interactive layer that floats over content, and let the content itself stay opaque and legible. (App icons get a *related* but separate Liquid Glass treatment authored in Icon Composer — see **[04 · Variants](04-variants-regular-clear.md)**.)

## Vocabulary (use these terms)

Consistent language keeps a team aligned. These are the words Apple and this documentation use:

- **Lensing / refraction** — the edges bend light to create depth and separate layers. The defining behavior.
- **Specular highlight** — bright rim glints that follow geometry and respond to device motion or the pointer.
- **Translucency** — adaptive see-through blur that samples the background.
- **Adaptive / adaptivity** — automatic shifts in tint and legibility with content and light/dark mode.
- **Regular** and **Clear** — the two material variants (see **[04 · Variants](04-variants-regular-clear.md)**).
- **Morph** — the fluid way glass elements stretch, merge, and reflow during transitions.
- **Illumination** — the underneath glow used as touch feedback on interactive glass.
- **Bezel** — the thin curved edge band where refraction happens (the interior stays flat).

## Sources

- Apple Developer — *Adopting Liquid Glass* / Technology Overviews: https://developer.apple.com/documentation/technologyoverviews/liquid-glass
- WWDC25 — *Meet Liquid Glass*: https://developer.apple.com/videos/play/wwdc2025/219/
- Apple Human Interface Guidelines — Materials: https://developer.apple.com/design/human-interface-guidelines/materials
- Create with Swift — *Exploring a new visual language: Liquid Glass*: https://www.createwithswift.com/exploring-a-new-visual-language-liquid-glass/
