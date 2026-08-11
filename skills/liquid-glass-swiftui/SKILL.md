---
name: liquid-glass-swiftui
description: >
  Build Apple-native "Liquid Glass" (iOS 26 / iPadOS 26 / macOS 26) UI in SwiftUI using the SYSTEM
  API — .glassEffect, GlassEffectContainer, .buttonStyle(.glass). Real GPU refraction is handled by
  the OS. Fire on "liquid glass in SwiftUI", "iOS 26 glass effect", ".glassEffect", "glass button
  SwiftUI", "Apple native glass" when the output is Swift.
---

# Liquid Glass — SwiftUI (Apple native)

This is the **reference implementation**: real, GPU-composited Liquid Glass with true refraction on
every Apple device. You do **not** reimplement the optics — the system draws them. Reduce-transparency,
reduce-motion, and adaptivity are all handled by the OS. Use the native iOS 26 API.

## When to use

Trigger on: "add the iOS 26 glass effect in SwiftUI", "make a glass button/toolbar", "use
.glassEffect", "Apple-native Liquid Glass". For web/React/Flutter output, use the sibling skills
instead — this one is Swift only.

## The one rule that matters

**Liquid Glass = glassmorphism + genuine edge refraction (lensing). Blur alone is a fail.** On Apple
platforms you get real refraction for free from `.glassEffect(...)` — so the failure mode here is not
faking it, it is **misusing** it: stacking glass on glass, applying it to content instead of the
navigation layer, or reaching for `.ultraThinMaterial` (that is blur only) when the target is iOS 26.

## Procedure

1. **Apply the material:** `.glassEffect(_ glass: Glass = .regular, in: Shape = Capsule())`. Choose
   the `Glass` value: `.regular` (default, adaptive, self-legible — use ~95% of the time), `.clear`
   (permanently more transparent — only over bright media with bold foreground), `.identity`.
2. **Shape it** to match the container: `in: .rect(cornerRadius: 28)`, `Capsule()`, or
   `.rect(cornerRadius: .containerConcentric)` to stay concentric with the enclosing container.
3. **Modify the `Glass` value**, not the view: `.regular.tint(.blue)` for a subtle tint (signals a
   primary action — keep it restrained), `.interactive()` for touch-reactive highlight/scale.
4. **Buttons:** `.buttonStyle(.glass)` for a standard glass button, `.buttonStyle(.glassProminent)`
   for a tinted prominent one. Prefer these over hand-rolling a glass background on a button.
5. **Group + morph:** wrap related glass elements in `GlassEffectContainer(spacing:)` so they blend
   and merge fluidly. Give each `.glassEffectID(_:in:)` with a shared `@Namespace` and animate with
   `withAnimation { ... }` so they morph across state changes.
6. **Reserve glass for the navigation layer** — bars, toolbars, sidebars, floating controls,
   sheets. **No glass-on-glass**: don't place a glass element on another glass surface; put content
   on an opaque/material base and float the glass control above it.
7. **Backward compatibility:** gate behind `if #available(iOS 26.0, *)` and fall back to
   `.ultraThinMaterial` (blur only — acceptable degradation) on older OSes.
8. **Let the system handle a11y.** Don't defeat Reduce Transparency / Reduce Motion; the OS adapts
   the material automatically.

## Minimal template (SwiftUI)

```swift
import SwiftUI

struct GlassToolbar: View {
  @Namespace private var glassNS
  @State private var expanded = false

  var body: some View {
    ZStack {
      Image("backdrop").resizable().scaledToFill().ignoresSafeArea() // rich backdrop

      GlassEffectContainer(spacing: 12) {
        HStack(spacing: 12) {
          Image(systemName: "house")
            .padding()
            .glassEffect(.regular, in: .rect(cornerRadius: 22))
            .glassEffectID("home", in: glassNS)

          if expanded {
            Image(systemName: "plus")
              .padding()
              .glassEffect(.regular.tint(.blue).interactive(), in: .rect(cornerRadius: 22))
              .glassEffectID("new", in: glassNS)
          }
        }
      }
      .onTapGesture { withAnimation { expanded.toggle() } }

      Button("Play") { }.buttonStyle(.glass)
      Button("Buy")  { }.buttonStyle(.glassProminent)
    }
  }
}

// Backward-compatible helper for pre-iOS 26.
extension View {
  @ViewBuilder func liquidGlass(_ radius: CGFloat) -> some View {
    if #available(iOS 26.0, *) {
      self.glassEffect(.regular, in: .rect(cornerRadius: radius))
    } else {
      self.background(.ultraThinMaterial, in: .rect(cornerRadius: radius))
    }
  }
}
```

## Common mistakes to avoid

- Glass-on-glass stacking (the #1 native misuse) — muddy depth, degraded legibility.
- Applying `.glassEffect` to content/body backgrounds instead of the navigation layer.
- Using `.clear` over text or plain backgrounds (it is not self-legible; reserve for bright media).
- Heavy `.tint(...)` that turns the control into a solid colored card.
- Shipping `.ultraThinMaterial` on iOS 26 and calling it Liquid Glass (that is blur only).
- Forgetting `GlassEffectContainer` + `.glassEffectID` when elements should morph together.
- Fighting the system's Reduce Transparency / Reduce Motion adaptation.
- No availability gate, so the build breaks on older OS targets.

## References in this repo

- `../../packages/swiftui/LiquidGlass.swift` — SwiftUI helpers/wrappers for this repo.
- `../../docs/11-cross-platform.md` — SwiftUI section: `.glassEffect`, container, buttons, fallback.
- `../../docs/04-variants-regular-clear.md` — Regular vs Clear (`.regular` vs `.clear`) rules.
- `../../docs/05-ui-ux-guidelines.md` — navigation-layer / no-glass-on-glass guidance.
- Apple — *Adopting Liquid Glass*: https://developer.apple.com/documentation/technologyoverviews/liquid-glass
- Apple — `glassEffect(_:in:)`: https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:)
