/*!
 * LiquidLens — liquid-glass.js (core engine)  v1.0
 * =====================================================================
 * Apple-style "Liquid Glass" material for the web. Zero dependencies.
 * Produces GENUINE edge refraction by generating a per-element SVG
 * displacement map and using it as a `backdrop-filter`, then layering
 * translucency, specular highlights, chromatic edge, and adaptive depth.
 *
 * Works as: a plain <script> global (window.LiquidGlass / window.LiquidLens),
 * a CommonJS module, or an ES module (see the exports at the bottom).
 *
 * ── QUICK START ──────────────────────────────────────────────────────
 *   <link rel="stylesheet" href="liquid-glass.css">
 *   <div class="lg-glass" data-glass style="--lg-radius:28px;padding:24px">Hi</div>
 *   <script src="liquid-glass.js"></script>
 *   <script>LiquidGlass.init({ refraction:18, bezel:22, blur:3 });</script>
 *
 * ── PUBLIC API ───────────────────────────────────────────────────────
 *   init(options?)      Scan [data-glass], apply, wire resize + pointer + observer. Call once.
 *   apply(el, opts?)    (Re)apply to one element (reads its live size + radius + data-* overrides).
 *   applyAll()          Re-apply to every [data-glass] element.
 *   set(partial)        Merge params into global state, update CSS vars, re-render. For live controls.
 *   refresh(el)         Alias of apply(el); use after mutating an element's size.
 *   destroy()           Remove observers/listeners and injected filters.
 *   state               Current global params.
 *   makeDisplacementMap(w,h,radius,bezel) -> dataURL  (advanced / testing)
 *
 * ── PER-ELEMENT OVERRIDES (data attributes) ──────────────────────────
 *   data-lg-refraction, data-lg-bezel, data-lg-blur, data-lg-saturation
 *   data-glass-variant="clear"          (same as adding class .lg-clear)
 *   Example: <div class="lg-glass" data-glass data-lg-refraction="34" data-lg-bezel="30">
 *
 * ── THE PHYSICS (see docs/02-optics-and-physics.md) ──────────────────
 *   Edge = convex squircle  height(x) = (1 - (1-x)^4)^(1/4).
 *   Across the bezel: slope -> incidence angle -> Snell (air n=1 -> glass n=1.5)
 *   -> ray deflection = displacement magnitude. Direction = outward SDF normal.
 *   Encoded into R (x) / G (y) channels (128 = none). feDisplacementMap then
 *   shifts each backdrop pixel by ((R-128)/127, (G-128)/127) * scale.
 *
 * ── BROWSER SUPPORT ──────────────────────────────────────────────────
 *   SVG-filter-as-backdrop-filter refraction: Chromium (Chrome/Edge/Arc/Brave/Opera).
 *   Safari & Firefox ignore the filter and fall back to blur + specular (still glassy).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; // CommonJS
  if (root) {
    root.LiquidGlass = api;                                               // global
    root.LiquidLens = api;                                                // brand alias
  }
})(typeof globalThis !== 'undefined' ? globalThis
   : typeof self !== 'undefined' ? self
   : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var filterRoot = null;
  var uid = 0;
  var observers = [];

  var defaults = {
    refraction: 18,   // feDisplacementMap scale (px) — edge bend strength
    bezel: 22,        // width (px) of the refracting edge band
    blur: 3,          // backdrop blur (px) — keep LOW (0-4) or refraction is lost
    saturation: 1.8,  // backdrop saturate() multiplier
    specular: 0.9,    // rim/highlight intensity 0..1.5 (drives CSS var --lg-spec)
    tintHue: 220,     // HSL hue of tint 0..360
    tintOpacity: 0.10,// tint alpha 0..0.4
    quality: 360,     // max displacement-map dimension (perf cap)
    tilt: false       // if true, specular tracks DeviceOrientation (mobile)
  };
  var state = assign({}, defaults);

  function assign(t) {
    for (var i = 1; i < arguments.length; i++) {
      var s = arguments[i]; if (!s) continue;
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k];
    }
    return t;
  }
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
  function num(v, fallback) { var n = parseFloat(v); return isNaN(n) ? fallback : n; }

  /* ---- 1D refraction profile of a convex squircle edge (normalized 0..1) ---- */
  function buildProfile(samples) {
    var f = function (u) { u = clamp(u, 0, 1); return Math.pow(1 - Math.pow(1 - u, 4), 1 / 4); };
    var eps = 0.001, n = 1 / 1.5, arr = [], max = 0;
    for (var i = 0; i <= samples; i++) {
      var t = i / samples;
      var slope = (f(t + eps) - f(t - eps)) / (2 * eps);
      var th1 = Math.atan(slope);
      var th2 = Math.asin(Math.min(1, n * Math.sin(th1)));
      var d = Math.tan(th1 - th2);
      arr.push(d); if (d > max) max = d;
    }
    return arr.map(function (v) { return max > 0 ? v / max : 0; });
  }
  var PROFILE = buildProfile(128);
  function sampleProfile(t) {
    var x = clamp(t, 0, 1) * (PROFILE.length - 1);
    var i = Math.floor(x), fr = x - i;
    return PROFILE[i] * (1 - fr) + PROFILE[Math.min(i + 1, PROFILE.length - 1)] * fr;
  }

  /* ---- signed distance to a rounded rectangle (negative = inside) ---- */
  function sdRoundRect(x, y, w, h, r) {
    var qx = Math.abs(x - w / 2) - (w / 2 - r);
    var qy = Math.abs(y - h / 2) - (h / 2 - r);
    var ax = Math.max(qx, 0), ay = Math.max(qy, 0);
    return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
  }

  /* ---- generate the displacement-map bitmap as a data URL ---- */
  function makeDisplacementMap(w, h, radius, bezel) {
    var s = Math.min(1, state.quality / Math.max(w, h));
    var W = Math.max(8, Math.round(w * s)), H = Math.max(8, Math.round(h * s));
    var R = Math.max(1, radius * s), B = Math.max(2, bezel * s);
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var ctx = c.getContext('2d'); var img = ctx.createImageData(W, H); var d = img.data;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var i = (y * W + x) * 4;
      var dist = sdRoundRect(x + 0.5, y + 0.5, W, H, R);
      var depth = -dist, rx = 0, ry = 0;
      if (dist < 0 && depth < B) {
        var t = depth / B, mag = sampleProfile(t);
        var gx = sdRoundRect(x + 1.5, y + 0.5, W, H, R) - sdRoundRect(x - 0.5, y + 0.5, W, H, R);
        var gy = sdRoundRect(x + 0.5, y + 1.5, W, H, R) - sdRoundRect(x + 0.5, y - 0.5, W, H, R);
        var gl = Math.hypot(gx, gy) || 1;
        rx = (gx / gl) * mag; ry = (gy / gl) * mag;   // outward normal -> magnifying lens
      }
      d[i] = 128 + rx * 127; d[i + 1] = 128 + ry * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function ensureRoot() {
    if (filterRoot && document.body.contains(filterRoot)) return;
    filterRoot = document.createElementNS(NS, 'svg');
    filterRoot.setAttribute('aria-hidden', 'true');
    filterRoot.setAttribute('id', 'lg-filter-root');
    filterRoot.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    document.body.appendChild(filterRoot);
  }
  function radiusOf(el) { return parseFloat(getComputedStyle(el).borderTopLeftRadius) || 24; }
  function reducedTransparency() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
  }

  /* ---- apply the material to a single element ---- */
  function apply(el, opts) {
    if (reducedTransparency()) return; // CSS provides an opaque fallback; skip GPU work
    ensureRoot();
    var ds = el.dataset || {};
    var o = assign({}, state, opts, {
      refraction: num(ds.lgRefraction, (opts && opts.refraction) != null ? opts.refraction : state.refraction),
      bezel:      num(ds.lgBezel,      (opts && opts.bezel)      != null ? opts.bezel      : state.bezel),
      blur:       num(ds.lgBlur,       (opts && opts.blur)       != null ? opts.blur       : state.blur),
      saturation: num(ds.lgSaturation, (opts && opts.saturation) != null ? opts.saturation : state.saturation)
    });
    var rect = el.getBoundingClientRect();
    var w = Math.round(rect.width), h = Math.round(rect.height);
    if (w < 4 || h < 4) return;
    var isClear = el.classList.contains('lg-clear') || ds.glassVariant === 'clear';
    var radius = Math.min(radiusOf(el), Math.min(w, h) / 2);
    var bezel = Math.min(o.bezel, Math.min(w, h) / 2 - 1);
    var scale = isClear ? o.refraction * 0.5 : o.refraction;

    var id = ds.lgId; if (!id) { id = 'lg' + (uid++); el.dataset.lgId = id; }
    var map = makeDisplacementMap(w, h, radius, Math.max(2, bezel));

    var f = document.getElementById(id); if (f) f.remove();
    f = document.createElementNS(NS, 'filter');
    f.setAttribute('id', id);
    f.setAttribute('color-interpolation-filters', 'sRGB');
    f.setAttribute('x', '0'); f.setAttribute('y', '0');
    f.setAttribute('width', '100%'); f.setAttribute('height', '100%');
    f.innerHTML =
      '<feImage href="' + map + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="none" result="m"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="m" scale="' + scale + '" xChannelSelector="R" yChannelSelector="G"/>';
    filterRoot.appendChild(f);

    var blur = isClear ? Math.min(o.blur, 2) : o.blur;
    var sat = isClear ? 1.4 : o.saturation;
    var fx = 'blur(' + blur + 'px) saturate(' + sat + ') url(#' + id + ')';
    el.style.webkitBackdropFilter = fx;
    el.style.backdropFilter = fx;
  }
  function refresh(el) { apply(el); }

  function setVars() {
    var r = document.documentElement.style;
    r.setProperty('--lg-blur', state.blur + 'px');
    r.setProperty('--lg-sat', state.saturation);
    r.setProperty('--lg-spec', state.specular);
    r.setProperty('--lg-tint-h', state.tintHue);
    r.setProperty('--lg-tint-a', state.tintOpacity);
  }

  var raf = null;
  function applyAll() { var list = document.querySelectorAll('[data-glass]'); for (var i = 0; i < list.length; i++) apply(list[i]); }
  function schedule() { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(applyAll); }
  function set(partial) { assign(state, partial); setVars(); schedule(); }

  var pointerBound = false;
  function onPointer(e) {
    var r = document.documentElement.style;
    r.setProperty('--lg-lx', (e.clientX / innerWidth * 100).toFixed(1) + '%');
    r.setProperty('--lg-ly', (e.clientY / innerHeight * 100).toFixed(1) + '%');
    r.setProperty('--lg-edge', (90 + (e.clientX / innerWidth - 0.5) * 80).toFixed(0) + 'deg');
  }
  function onTilt(e) {
    var r = document.documentElement.style;
    var gx = clamp((e.gamma || 0) / 45, -1, 1), gy = clamp((e.beta || 0) / 45, -1, 1);
    r.setProperty('--lg-lx', (50 + gx * 40).toFixed(1) + '%');
    r.setProperty('--lg-ly', (30 + gy * 40).toFixed(1) + '%');
  }
  function bindMotion() {
    if (pointerBound) return; pointerBound = true;
    window.addEventListener('pointermove', onPointer);
    if (state.tilt && window.DeviceOrientationEvent) window.addEventListener('deviceorientation', onTilt);
  }

  function init(opts) {
    assign(state, opts); setVars(); bindMotion();
    var run = function () { applyAll(); setTimeout(applyAll, 150); };
    if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
    window.addEventListener('resize', schedule);
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(schedule); observers.push(ro);
      var list = document.querySelectorAll('[data-glass]');
      for (var i = 0; i < list.length; i++) ro.observe(list[i]);
    }
    if ('MutationObserver' in window) {
      var mo = new MutationObserver(function (muts) {
        for (var j = 0; j < muts.length; j++) {
          var added = muts[j].addedNodes;
          for (var k = 0; k < added.length; k++) {
            var node = added[k];
            if (node.nodeType === 1 && (node.matches && node.matches('[data-glass]'))) { apply(node); }
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true }); observers.push(mo);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    return api;
  }

  function destroy() {
    for (var i = 0; i < observers.length; i++) observers[i].disconnect();
    observers = [];
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('deviceorientation', onTilt);
    if (filterRoot) { filterRoot.remove(); filterRoot = null; }
    pointerBound = false;
  }

  var api = {
    init: init, apply: apply, applyAll: applyAll, set: set, refresh: refresh,
    destroy: destroy, state: state, makeDisplacementMap: makeDisplacementMap, _defaults: defaults
  };
  return api;
});
