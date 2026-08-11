# liquid_lens (Flutter)

Apple **Liquid Glass** for Flutter. Two layers, honestly labelled:

- `LiquidGlass` — **glassmorphism** (BackdropFilter blur + tint + specular rim + adaptive shadow). Zero extra dependencies. Works on every platform Flutter targets.
- `LiquidGlassRefractive` — **true edge refraction** via the bundled `liquid_glass.frag` fragment shader (same squircle + Snell + SDF model as the web engine).

> Want shape‑merging, lighting, and a polished widget set out of the box? Use the community package [`liquid_glass_renderer`](https://pub.dev/packages/liquid_glass_renderer) (`LiquidGlass` / `LiquidGlassLayer` / `Glassify`; settings `thickness`, `blur`, `refractiveIndex ≈ 1.5`, `glassColor`, `lightAngle`). This package is the "own the code yourself" option.

## Install

Copy `liquid_glass.dart` into `lib/` and `liquid_glass.frag` into a `shaders/` folder at your project root, then register the shader in `pubspec.yaml`:

```yaml
flutter:
  shaders:
    - shaders/liquid_glass.frag
```

(If you instead consume this as a package named `liquid_lens`, register and load `packages/liquid_lens/liquid_glass.frag` — `LiquidGlassRefractive.load()` accepts the asset path as an optional argument.)

## Usage

### Glassmorphism (no dependencies)

```dart
Stack(children: [
  const MyScenicBackground(),
  Center(
    child: LiquidGlass(
      borderRadius: 30,
      blur: 12,
      tint: Colors.blue,        // optional semantic tint
      child: const Text('Liquid Glass',
          style: TextStyle(color: Colors.white, fontSize: 20)),
    ),
  ),
]);
```

### True refraction (fragment shader)

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LiquidGlassRefractive.load();   // compile the shader once
  runApp(const MyApp());
}

LiquidGlassRefractive(
  size: const Size(280, 160),
  borderRadius: 30,
  bezel: 22,
  refraction: 18,
  blur: 3,
  child: const Center(child: Text('Refracting',
      style: TextStyle(color: Colors.white))),
);
```

## Parameters

| Widget | Params |
|--------|--------|
| `LiquidGlass` | `borderRadius`, `blur`, `variant` (`regular`/`clear`), `tint`, `tintOpacity`, `padding` |
| `LiquidGlassRefractive` | `size`, `borderRadius`, `bezel`, `refraction`, `blur`, `tint`, `tintOpacity` |

## Notes

- **Real refraction needs the fragment shader.** Plain `BackdropFilter` blur is glassmorphism, not Liquid Glass.
- Keep `blur` modest so the refraction reads.
- Glass is the floating layer above content — don't stack glass‑on‑glass.
- The `.frag` uses `#include <flutter/runtime_effect.glsl>`; it targets Impeller. If `ImageFilter.shader`/`compose` is unavailable on your Flutter channel, fall back to `LiquidGlass` (the code does this automatically when the shader isn't loaded).

See `../../docs/11-cross-platform.md` and `../../docs/02-optics-and-physics.md`.
