# @liquidlens/react-native

React Native (TypeScript) bindings for **LiquidLens** — Apple-style _Liquid
Glass_ on native. React Native has no CSS `backdrop-filter`, so this package
ships **two layers** with an explicit trade-off:

| Component          | Technique                                   | Refraction? | Cost      | Support                    |
| ------------------ | ------------------------------------------- | ----------- | --------- | -------------------------- |
| `<LiquidGlass>`    | Native blur + tint + specular rim + shadow  | **No**      | Cheap     | Anywhere expo-blur runs    |
| `<LiquidGlassSkia>`| SkSL runtime shader over the Skia backdrop  | **Yes**     | GPU-heavy | Skia-capable RN (New Arch) |

> **The important distinction:** `<LiquidGlass>` is _glassmorphism_ — frosted,
> tinted, layered, but flat at the edge. `<LiquidGlassSkia>` is _true Liquid
> Glass_ — it actually bends the backdrop at the rim (a magnifying lens), using
> the same optical model as the web engine's Chromium refraction path.

---

## Install

Base + blur component:

```bash
# Expo (recommended)
npx expo install expo-blur expo-linear-gradient

# Bare React Native alternatives:
#   npm install @react-native-community/blur react-native-linear-gradient
```

For true refraction (`<LiquidGlassSkia>`):

```bash
npx expo install @shopify/react-native-skia
```

`react` and `react-native` are peer dependencies.

### Swapping the blur/gradient providers (bare RN)

`LiquidGlass.tsx` imports `expo-blur` and `expo-linear-gradient`. If you're not
on Expo, change the two imports at the top of that file:

```ts
// expo-blur  →  @react-native-community/blur
import { BlurView } from '@react-native-community/blur';
// map: intensity (0..100) → blurAmount (0..~25); tint 'default'|'light' → blurType

// expo-linear-gradient  →  react-native-linear-gradient
import LinearGradient from 'react-native-linear-gradient';
```

---

## Usage

### 1. Blur / glassmorphism — `<LiquidGlass>`

Works over any content behind it (an image, a scroll view, etc.).

```tsx
import { LiquidGlass } from '@liquidlens/react-native';

export function Card() {
  return (
    <LiquidGlass variant="regular" radius={28} tint="blue" style={{ padding: 24 }}>
      <Text style={{ color: '#fff', fontWeight: '600' }}>Frosted glass</Text>
    </LiquidGlass>
  );
}
```

Clear variant (thinner, with an automatic legibility scrim):

```tsx
<LiquidGlass variant="clear" radius={32} blurAmount={16} style={{ padding: 28 }}>
  <Text style={{ color: '#fff' }}>Clear glass over a photo</Text>
</LiquidGlass>
```

### 2. True refraction — `<LiquidGlassSkia>`

Renders a Skia `<Canvas>` that refracts everything painted behind it. Give it an
explicit `width`/`height` (the shader needs the pixel resolution) and place it
above the content you want to distort.

```tsx
import { LiquidGlassSkia } from '@liquidlens/react-native';

export function GlassLens() {
  return (
    <LiquidGlassSkia
      width={280}
      height={160}
      radius={28}
      refraction={18}
      bezel={22}
      tint="blue"
    >
      <Text style={{ color: '#fff', fontWeight: '700' }}>Liquid Glass</Text>
    </LiquidGlassSkia>
  );
}
```

> **Experimental & costly.** The shader runs Snell refraction plus multi-tap
> sampling for every pixel each frame. Keep instances modest in size/count and
> avoid animating many at once. Fidelity target is "Chromium-equivalent", not
> pixel-identical to Apple's compositor.

The raw SkSL is exported as `LIQUID_GLASS_SKSL` if you want to embed it in your
own Skia pipeline.

---

## Props

### `<LiquidGlass>` (blur)

| Prop         | Type                                                | Default     | Description                                        |
| ------------ | --------------------------------------------------- | ----------- | -------------------------------------------------- |
| `variant`    | `'regular' \| 'clear'`                              | `'regular'` | `clear` = less blur/tint + darkening scrim.        |
| `radius`     | `number`                                            | `28`        | Corner radius (px).                                |
| `blurAmount` | `number`                                            | `40` / `18` | expo-blur `intensity` (0..100).                    |
| `tint`       | `'blue' \| 'green' \| 'red' \| 'purple' \| 'amber'` | —           | Semantic tint preset.                              |
| `style`      | `StyleProp<ViewStyle>`                              | —           | Surface style (padding, size, position).           |
| `children`   | `React.ReactNode`                                   | —           | Content above the glass.                           |

### `<LiquidGlassSkia>` (refraction)

| Prop         | Type                                                | Default     | Description                                        |
| ------------ | --------------------------------------------------- | ----------- | -------------------------------------------------- |
| `width`      | `number`                                            | required    | Surface width (px) — feeds the shader resolution.  |
| `height`     | `number`                                            | required    | Surface height (px).                               |
| `variant`    | `'regular' \| 'clear'`                              | `'regular'` | `clear` halves refraction for a thinner look.      |
| `radius`     | `number`                                            | `28`        | Corner radius (px).                                |
| `refraction` | `number`                                            | `18`        | Edge-bend strength (px).                           |
| `bezel`      | `number`                                            | `22`        | Refracting band width (px).                        |
| `blur`       | `number`                                            | `1`         | Cheap edge softening on backdrop sampling (px).    |
| `tint`       | `'blue' \| 'green' \| 'red' \| 'purple' \| 'amber'` | —           | Semantic tint preset.                              |
| `style`      | `StyleProp<ViewStyle>`                              | —           | Container style (positioning).                     |
| `children`   | `React.ReactNode`                                   | —           | Content above the glass.                           |

Both components share the tint presets exported as `TINTS`, mirrored from the
web core's `.lg-tint-*` hues so colours match across platforms.
