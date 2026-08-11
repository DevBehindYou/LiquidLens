// liquid_glass.dart
// LiquidLens — Flutter port of Apple's "Liquid Glass".
// ---------------------------------------------------------------------------
// Flutter gives you two building blocks:
//   • BackdropFilter + ImageFilter.blur  → translucency (glassmorphism).
//   • FragmentShader (GLSL/SkSL)          → GENUINE edge refraction (the real thing).
//
// This file ships a dependency-free `LiquidGlass` widget that does the
// glassmorphism layer (blur + tint + specular rim + adaptive shadow) and,
// when you provide the bundled fragment shader, upgrades to true refraction
// via `LiquidGlassRefractive`.
//
// For a batteries-included option with shape-merging and lighting, see the
// pub.dev package `liquid_glass_renderer` (widgets LiquidGlass / LiquidGlassLayer
// / Glassify; settings: thickness, blur, refractiveIndex ≈ 1.5, glassColor,
// lightAngle, lightIntensity). This file is the "own it yourself" version.
//
// BEST PRACTICE: glass is the floating navigation layer over content. Don't
// stack glass-on-glass. Keep blur modest so refraction reads.
//
// pubspec.yaml (for the refractive variant, with the .frag copied into your app):
//   flutter:
//     shaders:
//       - shaders/liquid_glass.frag

import 'dart:ui' as ui;
import 'package:flutter/material.dart';

enum LiquidGlassVariant { regular, clear }

/// Glassmorphism layer: blur + tint + specular rim + shadow. No dependencies.
class LiquidGlass extends StatelessWidget {
  const LiquidGlass({
    super.key,
    required this.child,
    this.borderRadius = 28,
    this.blur = 12,
    this.variant = LiquidGlassVariant.regular,
    this.tint,
    this.tintOpacity = 0.10,
    this.padding = const EdgeInsets.all(20),
  });

  final Widget child;
  final double borderRadius;
  final double blur;                 // backdrop blur sigma
  final LiquidGlassVariant variant;
  final Color? tint;                 // semantic tint (optional)
  final double tintOpacity;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    final bool clear = variant == LiquidGlassVariant.clear;
    final double sigma = clear ? blur.clamp(0, 4) : blur;
    final Color base = (tint ?? Colors.white).withOpacity(clear ? tintOpacity * 0.35 : tintOpacity);
    final radius = BorderRadius.circular(borderRadius);

    return DecoratedBox(
      // adaptive drop shadow lifts the pane off the content
      decoration: BoxDecoration(
        borderRadius: radius,
        boxShadow: const [
          BoxShadow(color: Color(0x47000000), blurRadius: 34, offset: Offset(0, 12)),
          BoxShadow(color: Color(0x33000000), blurRadius: 8, offset: Offset(0, 2)),
        ],
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              color: base,
              borderRadius: radius,
              // specular rim: bright top-leading fading to a soft bottom-trailing glint
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withOpacity(0.18),
                  Colors.white.withOpacity(0.02),
                  Colors.white.withOpacity(0.10),
                ],
                stops: const [0.0, 0.5, 1.0],
              ),
              border: Border.all(color: Colors.white.withOpacity(0.28), width: 1),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

/// TRUE refraction using the bundled fragment shader (liquid_glass.frag).
/// Load once at app start:  await LiquidGlassRefractive.load();
class LiquidGlassRefractive extends StatelessWidget {
  const LiquidGlassRefractive({
    super.key,
    required this.child,
    required this.size,
    this.borderRadius = 28,
    this.bezel = 22,          // refracting edge band (px)
    this.refraction = 18,     // displacement scale (px)
    this.blur = 3,
    this.tint,
    this.tintOpacity = 0.10,
  });

  final Widget child;
  final Size size;
  final double borderRadius, bezel, refraction, blur, tintOpacity;
  final Color? tint;

  static ui.FragmentProgram? _program;

  /// Compile the refraction shader once at startup.
  /// [asset] must match the path you registered under `flutter: shaders:` in
  /// pubspec.yaml — `'shaders/liquid_glass.frag'` when you copy the file into
  /// your app, or `'packages/liquid_lens/liquid_glass.frag'` when consuming
  /// this as a package dependency.
  static Future<void> load([String asset = 'shaders/liquid_glass.frag']) async {
    _program ??= await ui.FragmentProgram.fromAsset(asset);
  }

  @override
  Widget build(BuildContext context) {
    final program = _program;
    final radius = BorderRadius.circular(borderRadius);
    // If the shader isn't loaded, degrade to the blur-only glass layer.
    if (program == null) {
      return SizedBox.fromSize(
        size: size,
        child: LiquidGlass(
          borderRadius: borderRadius, blur: blur, tint: tint,
          tintOpacity: tintOpacity, padding: EdgeInsets.zero, child: child),
      );
    }
    final shader = program.fragmentShader()
      ..setFloat(0, size.width)    // uSize.x
      ..setFloat(1, size.height)   // uSize.y
      ..setFloat(2, borderRadius)  // uRadius
      ..setFloat(3, bezel)         // uBezel
      ..setFloat(4, refraction);   // uScale

    return ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        // The shader samples the (blurred) backdrop and displaces edge pixels.
        filter: ui.ImageFilter.compose(
          outer: ui.ImageFilter.shader(shader),
          inner: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        ),
        child: Container(
          width: size.width,
          height: size.height,
          decoration: BoxDecoration(
            color: (tint ?? Colors.white).withOpacity(tintOpacity),
            borderRadius: radius,
            border: Border.all(color: Colors.white.withOpacity(0.28), width: 1),
          ),
          child: child,
        ),
      ),
    );
  }
}
