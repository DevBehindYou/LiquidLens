---
name: liquid-glass-flutter
description: >
  Build Apple-style "Liquid Glass" (iOS 26) surfaces in Flutter — cards, bars, buttons — with
  GENUINE edge refraction, not just a frosted BackdropFilter blur. Fire on "liquid glass in Flutter",
  "iOS 26 glass Flutter widget", "glassmorphism with refraction Flutter/Dart", "Apple glass UI" when
  the output is Dart.
---

# Liquid Glass — Flutter

Flutter composes the material from two pieces: a `BackdropFilter` (blur = glassmorphism) and a
`FragmentShader` (the refraction). Do not wire the shader by hand — use the community package
[`liquid_glass_renderer`](https://pub.dev/packages/liquid_glass_renderer), which ships the widgets and
the SkSL shader that implement the same squircle+Snell displacement as the web engine.

## When to use

Trigger on: "make a liquid glass card/bar/button in Flutter", "add the iOS 26 glass effect to this
widget", "Apple-style glass in Dart". If the user only wants a frosted panel, a bare `BackdropFilter`
+ translucent color is plain glassmorphism and this skill is overkill.

## The one rule that matters

**Liquid Glass = glassmorphism + genuine edge refraction (lensing). Blur alone is a fail.** A
`BackdropFilter(filter: ImageFilter.blur(...))` alone gives you frost with no lensing — the rim must
bend the backdrop. That is what `liquid_glass_renderer`'s shader provides; a plain blur is not Liquid
Glass. See `../../docs/11-cross-platform.md` (Flutter section) and `../../docs/02-optics-and-physics.md`.

## Procedure

1. **Add the dependency:** `flutter pub add liquid_glass_renderer`, then
   `import 'package:liquid_glass_renderer/liquid_glass_renderer.dart';`.
2. **Wrap a single surface** in `LiquidGlass(shape: ..., settings: ..., child: ...)`. Use
   `LiquidRoundedSuperellipse(borderRadius: ...)` for the Apple squircle corner.
3. **Tune with `LiquidGlassSettings`:** `thickness` (edge/lens depth), `blur` (**keep low, ~2–4**, or
   refraction is lost), `refractiveIndex` (~1.5 for window glass), `glassColor` (subtle low-alpha
   tint), `lightAngle` (specular sweep, in degrees).
4. **Group multiple shapes** in a `LiquidGlassLayer` so they refract and blend together and can morph
   — the Flutter equivalent of the web morph container. Use `Glassify` to wrap arbitrary children.
5. **Reserve glass for the navigation/overlay layer** — bars, floating panels, buttons. Avoid
   glass-on-glass stacking.
6. **Provide a rich backdrop** (image, gradient, scrolling content) behind the glass, or the lensing
   is invisible.
7. **Keep tint subtle** (low-alpha `glassColor`, ≲ 0.15 equivalent) so it reads as glass, not a
   colored card. Over bright media with bold foreground you may go more transparent, but add a
   dimming layer behind foreground text for legibility (the Clear-variant idea).
8. **Verify on device/emulator:** confirm the rim magnifies the backdrop over a photo or text; a flat
   blur is a fail. Check contrast of foreground text on the composited result.

## Minimal template (Dart)

```dart
import 'package:flutter/material.dart';
import 'package:liquid_glass_renderer/liquid_glass_renderer.dart';

class GlassCard extends StatelessWidget {
  const GlassCard({super.key});

  @override
  Widget build(BuildContext context) {
    // Group shapes in a layer so they refract/blend together (and can morph).
    return LiquidGlassLayer(
      child: LiquidGlass(
        shape: LiquidRoundedSuperellipse(borderRadius: Radius.circular(30)),
        settings: const LiquidGlassSettings(
          thickness: 12,
          blur: 3,                 // keep low or the refraction washes out
          refractiveIndex: 1.5,    // window glass
          glassColor: Color(0x1A88AAFF), // subtle tint (low alpha)
          lightAngle: 140,         // degrees — specular sweep
        ),
        child: const Padding(
          padding: EdgeInsets.all(24),
          child: Text('Hello, glass'),
        ),
      ),
    );
  }
}
```

## Common mistakes to avoid

- Using a bare `BackdropFilter` blur and calling it Liquid Glass (blur without refraction = fail).
- `blur` cranked high, which erases the lensing.
- Heavy `glassColor` alpha, so the surface reads as a solid colored card.
- Skipping the backdrop, so there is nothing to refract.
- Glass-on-glass stacking (muddy, slow).
- Illegible foreground over a bright backdrop with no dimming layer.
- Not wrapping related shapes in a `LiquidGlassLayer`, so they refract independently and can't morph.

## References in this repo

- `../../docs/11-cross-platform.md` — Flutter section: package, widgets, and settings.
- `../../docs/02-optics-and-physics.md` — the squircle+Snell refraction model the shader mirrors.
- `../../docs/03-material-anatomy.md` — the layer stack to mirror (tint, specular, depth).
- `../../docs/04-variants-regular-clear.md` — Regular vs Clear (transparency + scrim) reasoning.
- pub.dev — `liquid_glass_renderer`: https://pub.dev/packages/liquid_glass_renderer
