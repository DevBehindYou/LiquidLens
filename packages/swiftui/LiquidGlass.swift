//
//  LiquidGlass.swift
//  LiquidLens — SwiftUI adapter for Apple's Liquid Glass
//  ---------------------------------------------------------------------------
//  On iOS/iPadOS/macOS/watchOS/tvOS/visionOS 26+, Liquid Glass is a FIRST-PARTY
//  material. You do NOT reimplement the optics — you call Apple's native
//  `.glassEffect(_:in:)`. This file is a thin, ergonomic wrapper that:
//    1. exposes a single `.liquidGlass(...)` modifier with a friendly API,
//    2. degrades gracefully to `.ultraThinMaterial` + a specular overlay on
//       OSes older than 26 (so one codebase ships everywhere),
//    3. ships ready-made components (card, buttons, morphing container).
//
//  KEY NATIVE APIS (iOS 26+):
//    View.glassEffect(_ glass: Glass = .regular, in shape: some Shape = Capsule(), isEnabled: Bool = true)
//    Glass.regular / .clear / .identity         // .identity = conditionally off, no relayout
//    Glass.tint(_ color: Color)                 // semantic tint (primary action / state), not decoration
//    Glass.interactive()                        // iOS: scale + bounce + shimmer on touch
//    GlassEffectContainer(spacing:) { ... }      // group elements: shared sampling + morphing
//    View.glassEffectID(_:in:) + @Namespace     // morph between states with matched geometry
//    View.glassEffectTransition(_:)             // .materialize / .matchedGeometry / .identity
//    Button(...).buttonStyle(.glass)            // translucent control
//    Button(...).buttonStyle(.glassProminent)   // opaque, primary action
//
//  BEST PRACTICE (Apple HIG): reserve glass for the NAVIGATION layer floating
//  above content. Never stack glass-on-glass. The system auto-adapts to
//  Reduce Transparency, Increase Contrast, and Reduce Motion — no code needed.
//
//  Requires: Xcode 26+. Fallback path works back to iOS 15 / macOS 12.
//

import SwiftUI

// MARK: - Public API

/// LiquidLens variant, mapped to Apple's `Glass` on OS 26+.
public enum LiquidGlassVariant {
    case regular   // default — adaptive, self-legible, use almost everywhere
    case clear     // more transparent — only over bright, media-rich content
}

public extension View {

    /// Apply Liquid Glass to this view.
    ///
    /// - Parameters:
    ///   - variant: `.regular` (default) or `.clear` (over bright media only).
    ///   - shape: the glass shape (default `Capsule()`; use
    ///            `.rect(cornerRadius: .containerConcentric)` for cards).
    ///   - tint: an OPTIONAL semantic tint (primary action / active state).
    ///   - interactive: enable the touch scale/bounce/shimmer (iOS).
    ///
    /// On OS 26+ this calls the native `.glassEffect`. On older OSes it renders
    /// an `.ultraThinMaterial` fallback with a specular rim so the UI still ships.
    @ViewBuilder
    func liquidGlass<S: Shape>(_ variant: LiquidGlassVariant = .regular,
                               in shape: S = Capsule(),
                               tint: Color? = nil,
                               interactive: Bool = false) -> some View {
        if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            self.glassEffect(makeGlass(variant, tint: tint, interactive: interactive), in: shape)
        } else {
            self.modifier(LegacyLiquidGlass(shape: shape, tintColor: tint))
        }
    }
}

// MARK: - Native Glass builder (OS 26+)

@available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *)
private func makeGlass(_ variant: LiquidGlassVariant,
                       tint: Color?,
                       interactive: Bool) -> Glass {
    var glass: Glass = (variant == .clear) ? .clear : .regular
    if let tint { glass = glass.tint(tint) }
    if interactive { glass = glass.interactive() }
    return glass
}

// MARK: - Legacy fallback (pre-26): ultraThinMaterial + specular rim

private struct LegacyLiquidGlass<S: Shape>: ViewModifier {
    let shape: S
    let tintColor: Color?

    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial, in: shape)
            .overlay {
                shape.fill(tintColor?.opacity(0.16) ?? .clear)
            }
            .overlay {
                // specular rim: bright top-leading → dim → bright bottom-trailing
                shape.stroke(
                    LinearGradient(
                        colors: [.white.opacity(0.7), .white.opacity(0.05),
                                 .white.opacity(0.05), .white.opacity(0.45)],
                        startPoint: .topLeading, endPoint: .bottomTrailing),
                    lineWidth: 1)
            }
            .clipShape(shape)
            .shadow(color: .black.opacity(0.28), radius: 17, y: 12)
    }
}

// MARK: - Ready-made components

/// A glass card that floats above content. Uses a concentric rounded rectangle.
public struct LiquidGlassCard<Content: View>: View {
    private let cornerRadius: CGFloat
    private let variant: LiquidGlassVariant
    private let content: Content

    public init(cornerRadius: CGFloat = 28,
                variant: LiquidGlassVariant = .regular,
                @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.variant = variant
        self.content = content()
    }

    public var body: some View {
        content
            .padding(20)
            .liquidGlass(variant, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }
}

/// Convenience for the two native glass button styles (with a pre-26 fallback look).
public extension Button {
    @ViewBuilder
    func liquidGlassStyle(prominent: Bool = false, tint: Color? = nil) -> some View {
        if #available(iOS 26.0, macOS 26.0, *) {
            if prominent {
                self.buttonStyle(.glassProminent).tint(tint ?? .accentColor)
            } else {
                self.buttonStyle(.glass)
            }
        } else {
            self.buttonStyle(.plain)
                .padding(.horizontal, 20).padding(.vertical, 12)
                .liquidGlass(prominent ? .regular : .clear, tint: tint)
        }
    }
}

// MARK: - Examples (compile-time documentation)

#if DEBUG
@available(iOS 26.0, macOS 26.0, *)
private struct LiquidLensExamples: View {
    @Namespace private var glassNS
    @State private var expanded = false

    var body: some View {
        ZStack {
            // Content layer (NOT glass) — a scenic backdrop.
            LinearGradient(colors: [.pink, .purple, .blue, .cyan],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()

            VStack(spacing: 28) {

                // 1) A simple glass card.
                LiquidGlassCard {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Liquid Glass").font(.title2.bold())
                        Text("Native `.glassEffect` on iOS 26.")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                    .foregroundStyle(.white)
                }

                // 2) Grouped glass controls that morph together.
                GlassEffectContainer(spacing: 20) {
                    HStack(spacing: 20) {
                        Button("Save") {}.liquidGlassStyle(prominent: true, tint: .blue)
                        Button("Cancel") {}.liquidGlassStyle()
                        Button {} label: { Image(systemName: "square.and.arrow.up") }
                            .liquidGlassStyle()
                    }
                }

                // 3) A morphing expand/collapse using glassEffectID.
                GlassEffectContainer(spacing: 24) {
                    HStack(spacing: 16) {
                        Button(expanded ? "Close" : "More") {
                            withAnimation(.bouncy) { expanded.toggle() }
                        }
                        .liquidGlassStyle()
                        .glassEffectID("root", in: glassNS)

                        if expanded {
                            ForEach(["star", "heart", "bell"], id: \.self) { icon in
                                Image(systemName: icon)
                                    .padding(14)
                                    .liquidGlass(.regular, in: Circle(), interactive: true)
                                    .glassEffectID(icon, in: glassNS)
                            }
                        }
                    }
                }

                // 4) Tinted clear glass over vivid media (add your own dimming if text is thin).
                Text("PLAY")
                    .font(.headline).foregroundStyle(.white)
                    .padding(.horizontal, 28).padding(.vertical, 14)
                    .liquidGlass(.clear, in: Capsule(), tint: .orange, interactive: true)
            }
            .padding()
        }
    }
}
#endif
