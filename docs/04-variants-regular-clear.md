# 04 · Variants — Regular vs Clear

Apple ships **two** Liquid Glass variants. Picking the right one is a design decision with real legibility consequences, so it is worth being deliberate. LiquidLens mirrors both.

## Regular (the default — use this ~95% of the time)

> "Regular is the **default**. It is **fully adaptive** to any context, works effectively in **any size and environmental condition**, and **maintains automatic legibility.**"

- **Adaptive translucency** — it decides how transparent to be based on what's behind it.
- **Self-legible** — shadow and tone shift so foreground text stays readable without your help.
- **Safe over anything** — text, photos, video, busy or plain backgrounds.
- This is what navigation bars, toolbars, sidebars, Control Center, sliders, and most buttons use.

In LiquidLens: `class="lg-glass"` with no extra variant class.

```html
<div class="lg-glass lg-card" data-glass style="--lg-radius:30px;">
  Regular glass — safe everywhere
</div>
```

## Clear (special-purpose)

> "Clear is **permanently more transparent**. Use it **only over media-rich content**, and only when the foreground content is **bold and bright**. It requires a **dimming layer** to keep content legible."

- Lets much more of the background through — beautiful over photos and video, glassy and minimal.
- **Not self-legible.** Because it barely tints, text and icons on it can wash out.
- Apple pairs it with a **dimming scrim** behind the foreground content, and LiquidLens does the same.
- Wrong over text-heavy or low-contrast backgrounds — you will lose legibility.

In LiquidLens: `class="lg-glass lg-clear"` **plus** a `<span class="lg-scrim"></span>` child. The engine also automatically halves the refraction scale and caps blur/saturation for Clear, so it stays airy rather than smeary:

```html
<button class="lg-glass lg-clear lg-press lg-btn" data-glass data-glass-variant="clear">
  <span class="lg-scrim"></span>   <!-- dimming layer, required for legibility -->
  Play
</button>
```

You can select Clear either by adding the `.lg-clear` class **or** by setting `data-glass-variant="clear"` — the engine honors both.

## Decision table

| Context behind the glass | Foreground | Variant |
|---|---|---|
| Anything / unknown / text / other UI | any | **Regular** |
| Full-bleed photo or video | bold, bright, high-contrast | **Clear** (+ scrim) |
| Photo / video | thin or low-contrast text | **Regular** (Clear would be illegible) |
| Plain / solid color | any | **Regular** (Clear has nothing to refract; looks flat) |

## Tinted glass (a modifier, not a third variant)

Both variants can carry a **tint** — a hue wash used to signal a prominent or primary action (e.g. a confirm button). Keep it **subtle** (`tintOpacity` ≤ ~0.15); a heavy tint stops reading as glass and becomes a solid colored card. On Apple platforms the tint is often derived from surrounding content; in LiquidLens you set it with `tintHue` + `tintOpacity`, or with a semantic helper class:

```html
<button class="lg-glass lg-tint-blue lg-press lg-btn" data-glass>Confirm</button>
```

Available tint helpers: `.lg-tint-blue`, `.lg-tint-green`, `.lg-tint-red`, `.lg-tint-purple`, `.lg-tint-amber`. See **[08 · Design Tokens](08-design-tokens.md)** for their exact hue/alpha values.

## App icons note (related, but a different system)

iOS / iPadOS / macOS 26 app icons are **layered** and receive Liquid Glass treatment from the system, with four appearance modes: **Default (light), Dark, Clear, and Tinted**. Icons are authored in Apple's **Icon Composer** app, *not* with a UI material engine like LiquidLens — but the vocabulary (Clear / Tinted, layered highlights and shadows) is deliberately shared. If your task is *icons*, reach for Icon Composer. LiquidLens is for *UI surfaces* — bars, panels, buttons, sliders.

## Sources

- Apple Human Interface Guidelines — Materials / Liquid Glass: https://developer.apple.com/design/human-interface-guidelines/materials
- Apple Developer — *Adopting Liquid Glass*: https://developer.apple.com/documentation/technologyoverviews/liquid-glass
- Apple Developer — Icon Composer: https://developer.apple.com/icon-composer/
- Create with Swift — hierarchy, harmony, consistency: https://www.createwithswift.com/liquid-glass-redefining-design-through-hierarchy-harmony-and-consistency/
