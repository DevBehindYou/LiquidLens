# 11 · Cross-platform

Liquid Glass is a *material*, not a single implementation. The same five optical behaviors (refraction, translucency, specular, depth, adaptivity — see **[01 · What is Liquid Glass](01-what-is-liquid-glass.md)**) map onto every platform differently, depending on what the rendering stack can do. This page shows how LiquidLens and its ecosystem express the material on Web, React, React Native, Flutter, and Apple-native SwiftUI — with the honest fidelity ceiling for each.

| Platform | Translucency | Refraction | Fidelity |
|---|---|---|---|
| **Web (this engine)** | `backdrop-filter` | SVG `feDisplacementMap` (Chromium only) | Full on Chromium; blur fallback elsewhere |
| **React** | via the engine | via the engine | Same as Web (thin wrapper) |
| **React Native** | `expo-blur` / community blur | Skia runtime SkSL shader | Full with Skia; blur fallback otherwise |
| **Flutter** | `BackdropFilter` | `FragmentShader` (SkSL) | Full via `liquid_glass_renderer` |
| **SwiftUI (iOS 26+)** | system | system (real, GPU) | Native — the reference implementation |

## Web (the LiquidLens engine)

The canonical implementation, documented throughout these docs. Markup + `init()`:

```html
<link rel="stylesheet" href="packages/core/tokens.css">
<link rel="stylesheet" href="packages/core/liquid-glass.css">

<div class="lg-glass lg-card" data-glass style="--lg-radius:28px; padding:24px;">Hello</div>

<script src="packages/core/liquid-glass.js"></script>
<script>LiquidGlass.init({ refraction: 18, bezel: 22, blur: 3 });</script>
```

See **[06 · Web Implementation](06-web-implementation.md)** and **[10 · API Reference](10-api-reference.md)**.

## React

A thin wrapper over the same engine — no re-implementation. A `<LiquidGlass>` component applies the material on mount and refreshes on resize; a `useLiquidGlass` hook does the same for an existing ref. Both call straight into the core `apply` / `refresh` / `destroy` methods.

```jsx
import { useEffect, useRef } from 'react';
import LiquidGlass from 'liquidlens';

// Hook: attach the material to any element you already render.
export function useLiquidGlass(opts) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    LiquidGlass.apply(el, opts);
    const ro = new ResizeObserver(() => LiquidGlass.refresh(el));
    ro.observe(el);
    return () => ro.disconnect();
  }, [opts]);
  return ref;
}

// Component: a ready-made glass surface.
export function LiquidGlass_({ variant, className = '', children, ...opts }) {
  const ref = useLiquidGlass(opts);
  return (
    <div
      ref={ref}
      data-glass
      data-glass-variant={variant === 'clear' ? 'clear' : undefined}
      className={`lg-glass ${variant === 'clear' ? 'lg-clear' : ''} ${className}`}
    >
      {variant === 'clear' && <span className="lg-scrim" />}
      {children}
    </div>
  );
}

// Usage
<LiquidGlass_ className="lg-card" refraction={24} bezel={28}>
  Settings
</LiquidGlass_>;
```

Call `LiquidGlass.init()` once at app start (or rely on the per-element `apply` in the hook), and `LiquidGlass.set(...)` for live global changes.

## React Native

React Native has no `backdrop-filter`, so the material is assembled from two pieces:

- **Translucency** — a native blur view: `expo-blur`'s `<BlurView>` (Expo) or `@react-native-community/blur` (bare RN).
- **Real refraction** — a runtime **SkSL shader** rendered with `@shopify/react-native-skia`. The shader samples the backdrop and displaces edge pixels using the same squircle + Snell model as the web engine. Where Skia isn't available, fall back to the BlurView alone.

```tsx
import { Canvas, Fill, Shader, Skia, ImageShader } from '@shopify/react-native-skia';
import { BlurView } from 'expo-blur';

// SkSL: displace the backdrop near the rounded-rect edge (bezel), leave the center flat.
const source = Skia.RuntimeEffect.Make(`
  uniform shader image;      // the captured backdrop
  uniform float2 size;       // element size
  uniform float  radius;     // corner radius
  uniform float  bezel;      // edge band width
  uniform float  scale;      // refraction strength (px)

  float sdRoundRect(float2 p, float2 h, float r) {
    float2 q = abs(p) - h + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  half4 main(float2 xy) {
    float2 c = size * 0.5;
    float d = sdRoundRect(xy - c, c, radius);
    float depth = -d;
    float2 off = float2(0.0);
    if (d < 0.0 && depth < bezel) {
      float t = depth / bezel;
      float mag = pow(1.0 - pow(1.0 - t, 4.0), 0.25);  // squircle profile (approx)
      float2 n = normalize(float2(dFdx(d), dFdy(d)));   // outward normal
      off = n * mag * scale;
    }
    return image.eval(xy + off);
  }
`);

export function GlassPanel({ width, height }) {
  if (!source) {
    // Fallback: translucency only.
    return <BlurView intensity={40} tint="light" style={{ width, height, borderRadius: 28 }} />;
  }
  return (
    <Canvas style={{ width, height }}>
      <Fill>
        <Shader source={source} uniforms={{ size: [width, height], radius: 28, bezel: 22, scale: 18 }}>
          <ImageShader image={/* backdrop snapshot */ null} fit="cover" rect={{ x: 0, y: 0, width, height }} />
        </Shader>
      </Fill>
    </Canvas>
  );
}
```

Layer your specular rim, tint, and shadow on top with regular RN views/gradients, mirroring the web layer stack in **[03 · Material Anatomy](03-material-anatomy.md)**.

## Flutter

Flutter composes the material from a `BackdropFilter` (blur) plus a `FragmentShader` (refraction). Rather than wire that by hand, use the community package **[`liquid_glass_renderer`](https://pub.dev/packages/liquid_glass_renderer)**, which ships the widgets and the shader:

- `LiquidGlass` — a single glass surface.
- `LiquidGlassLayer` — groups multiple glass shapes so they refract and blend together (the Flutter equivalent of a morph container).
- `Glassify` — wraps arbitrary children in the material.
- `LiquidGlassSettings` — tuning: `thickness`, `blur`, `refractiveIndex` (~1.5 for glass), `glassColor`, `lightAngle`.

```dart
import 'package:flutter/material.dart';
import 'package:liquid_glass_renderer/liquid_glass_renderer.dart';

class GlassCard extends StatelessWidget {
  const GlassCard({super.key});

  @override
  Widget build(BuildContext context) {
    return LiquidGlass(
      shape: LiquidRoundedSuperellipse(borderRadius: Radius.circular(28)),
      settings: const LiquidGlassSettings(
        thickness: 12,
        blur: 3,
        refractiveIndex: 1.5,        // window glass
        glassColor: Color(0x1A88AAFF),
        lightAngle: 140,             // degrees; matches the rim sweep idea
      ),
      child: const Padding(
        padding: EdgeInsets.all(24),
        child: Text('Hello, glass'),
      ),
    );
  }
}
```

Group shapes for shared refraction and morphing:

```dart
LiquidGlassLayer(
  child: Row(children: const [GlassCard(), SizedBox(width: 10), GlassCard()]),
);
```

## SwiftUI / Apple native (iOS 26)

The reference implementation — real, GPU-composited Liquid Glass with true refraction on every Apple device. Reduce-transparency, reduce-motion, and adaptivity are all handled **by the system**; you don't reimplement them.

Apply the material with `.glassEffect(_:in:)`:

```swift
import SwiftUI

struct ContentView: View {
  var body: some View {
    Text("Hello, glass")
      .padding(24)
      .glassEffect(.regular, in: .rect(cornerRadius: 28))   // Glass.regular | .clear | .identity
  }
}
```

Tint and interactivity are modifiers on the `Glass` value:

```swift
Text("Confirm")
  .padding()
  .glassEffect(.regular.tint(.blue).interactive(), in: Capsule())
```

Group elements so they morph and merge fluidly with `GlassEffectContainer`, and drive morph transitions with `.glassEffectID(_:in:)` + a `@Namespace`:

```swift
struct Toolbar: View {
  @Namespace private var glassNS
  @State private var expanded = false

  var body: some View {
    GlassEffectContainer(spacing: 12) {
      HStack(spacing: 12) {
        Image(systemName: "house")
          .glassEffect(.regular, in: Capsule())
          .glassEffectID("home", in: glassNS)
        if expanded {
          Image(systemName: "plus")
            .glassEffect(.regular, in: Capsule())
            .glassEffectID("new", in: glassNS)
        }
      }
    }
    .onTapGesture { withAnimation { expanded.toggle() } }
  }
}
```

Buttons get glass styling directly:

```swift
Button("Play") { }.buttonStyle(.glass)             // standard glass button
Button("Buy")  { }.buttonStyle(.glassProminent)    // prominent (tinted) glass button
```

Use concentric shapes to match the container:

```swift
.glassEffect(.regular, in: .rect(cornerRadius: .containerConcentric))
```

**Backward compatibility.** Gate the new API behind availability and fall back to `.ultraThinMaterial` on older OSes:

```swift
extension View {
  @ViewBuilder func liquidGlass(_ radius: CGFloat) -> some View {
    if #available(iOS 26, *) {
      self.glassEffect(.regular, in: .rect(cornerRadius: radius))
    } else {
      self.background(.ultraThinMaterial, in: .rect(cornerRadius: radius))
    }
  }
}
```

## Sources

- Apple Developer — *Adopting Liquid Glass*: https://developer.apple.com/documentation/technologyoverviews/liquid-glass
- Apple Developer — `glassEffect(_:in:)` / SwiftUI: https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:)
- Apple Developer — `GlassEffectContainer`: https://developer.apple.com/documentation/swiftui/glasseffectcontainer
- WWDC25 — *Meet Liquid Glass*: https://developer.apple.com/videos/play/wwdc2025/219/
- pub.dev — `liquid_glass_renderer`: https://pub.dev/packages/liquid_glass_renderer
- Shopify — `@shopify/react-native-skia` (runtime shaders): https://shopify.github.io/react-native-skia/
- Expo — `expo-blur`: https://docs.expo.dev/versions/latest/sdk/blur-view/
