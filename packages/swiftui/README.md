# @liquidlens/swiftui

SwiftUI adapter for Apple's **Liquid Glass**. On OS 26+ it calls the *native* `.glassEffect` — LiquidLens does not fake the material on Apple platforms, it just gives you a friendlier API and a graceful pre‑26 fallback so one codebase ships everywhere.

## Requirements

- Xcode 26+ for the native path (`iOS/iPadOS/macOS/tvOS/watchOS/visionOS 26+`).
- Fallback path (`.ultraThinMaterial` + specular rim) works back to **iOS 15 / macOS 12**.

## Install

Drop `LiquidGlass.swift` into your target, or add it as a local Swift package.

## Usage

```swift
// 1. The one modifier — native glassEffect on 26+, fallback below.
Text("Hello")
    .padding()
    .liquidGlass()                                  // .regular, Capsule

// 2. A card shape with a concentric radius.
LiquidGlassCard(cornerRadius: 28) {
    Text("Now Playing").font(.headline)
}

// 3. Buttons (native .glass / .glassProminent).
Button("Save") {}.liquidGlassStyle(prominent: true, tint: .blue)
Button("Cancel") {}.liquidGlassStyle()

// 4. Clear + tint + interactive over vivid media.
Text("PLAY")
    .padding(.horizontal, 28).padding(.vertical, 14)
    .liquidGlass(.clear, in: Capsule(), tint: .orange, interactive: true)
```

### Grouping & morphing (native)

```swift
@Namespace private var ns
GlassEffectContainer(spacing: 24) {          // shared sampling + morph
    Button("More") { withAnimation(.bouncy) { expanded.toggle() } }
        .liquidGlassStyle()
        .glassEffectID("root", in: ns)
    if expanded {
        Image(systemName: "star").padding(14)
            .liquidGlass(.regular, in: Circle(), interactive: true)
            .glassEffectID("star", in: ns)
    }
}
```

## API

| Symbol | Description |
|--------|-------------|
| `.liquidGlass(_:in:tint:interactive:)` | Apply glass. `variant` = `.regular`/`.clear`; native on 26+, fallback below. |
| `LiquidGlassCard(cornerRadius:variant:) { }` | Ready-made floating card (continuous rounded rect). |
| `Button.liquidGlassStyle(prominent:tint:)` | Maps to `.buttonStyle(.glass)` / `.glassProminent`. |

## Native API cheat-sheet (what this wraps)

`glassEffect(_:in:isEnabled:)` · `Glass.regular/.clear/.identity` · `.tint(_:)` · `.interactive()` · `GlassEffectContainer(spacing:)` · `glassEffectID(_:in:)` + `@Namespace` · `glassEffectTransition(_:)` · `.buttonStyle(.glass)` / `.glassProminent` · shapes like `.rect(cornerRadius: .containerConcentric)`.

## Notes

- **Reserve glass for the navigation layer** floating over content. No glass‑on‑glass.
- The system handles **Reduce Transparency / Increase Contrast / Reduce Motion** automatically.
- Opt out during migration with `UIDesignRequiresCompatibility` in Info.plist (expires iOS 27).

See `../../docs/11-cross-platform.md` and `../../docs/05-ui-ux-guidelines.md`.
