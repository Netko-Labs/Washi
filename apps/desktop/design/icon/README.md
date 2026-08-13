# Handoff: Washi App Icon (v2 "Chibi" mascot)

Icon set for **Washi**, an AI note-taking app for macOS + iOS. The mascot is the washi
paper sheet itself — a chibi/moe character peeking up from the bottom edge: cream halo
outline, big glossy eyes, blush, open smile, a folded paper corner as an "ear", and two
paws resting on the icon edge.

## About these files
These are **design masters, not production code**. Your task is to generate the real
icon assets (asset catalogs / .icns) from them for the Xcode project.

- `masters/icon-light.svg` — full-bleed 1024×1024 light icon (vector source of truth)
- `masters/icon-dark.svg` — full-bleed 1024×1024 dark icon
- `masters/icon-tinted.svg` — iOS 18 tinted glyph: white shapes with alpha; eyes/mouth
  punched out; folded ear at 60% gray in the mask (renders as 60% alpha)
- `AppIcon.appiconset/` — ready-made iOS asset catalog: `Contents.json` + the three
  1024 PNGs already rendered from the masters (browser-rendered, so the SVG grain/fiber
  filters are baked in)
- `Icon Export.dc.html` — the sheet the PNGs were captured from (reference only)

Fidelity: **high-fidelity**. Use exact colors/geometry; do not restyle.

## What to build

### iOS (18+)
Drop `AppIcon.appiconset/` into `Assets.xcassets/` as-is. It declares the single
1024×1024 universal icon with `luminosity` appearances for dark and tinted — Xcode
generates all sizes. Verify the tinted PNG keeps its alpha channel.

### macOS
macOS icons are NOT full-bleed: the rounded-rect shape is baked into the artwork with
margins (~10% of canvas on each side, continuous-corner "squircle" radius ≈ 22.4% of
the shape width). Generate from `masters/icon-light.svg`:
1. Render the full-bleed square at 1024, scale to ~824×824, apply the squircle mask,
   center on a transparent 1024 canvas, add a subtle drop shadow (y≈10, blur≈20, ~30% black).
2. Produce an `.iconset` at 16/32/128/256/512 in 1x and 2x, then `iconutil -c icns`.
Prefer rendering the SVG in a headless browser (Playwright screenshot) or downscaling
the provided 1024 PNG with sharp — some SVG rasterizers (librsvg) mishandle
`feTurbulence`; the texture must survive or be dropped gracefully (it fades at small
sizes by design).

### Downscaling note
Below 64px the grain/fiber texture should disappear (it does naturally). The read at
small sizes is: warm orange field + cream character + dark eyes. Never sharpen.

## Design tokens
Light: bg gradient `#D4713F → #E28C55` (vertical), paper `#F7EDD6`, halo `#FFF6E4`,
outline `#6B3A1F` (18px at 1024), ear (folded corner) sage `#AEBB9A`, blush `#F0A487`,
mouth `#7A3A22`, tongue `#E8836B`, eyes `#2A1B12` with white highlights.
Dark: bg gradient `#31261E → #221A14` (never pure black), paper `#F4E2B8`, glow
`#E8A85C` @ 55% blurred 60px behind character, outline `#4A2E1B`, ear `#D2A360`,
blush `#E39A6E`, eye highlights `#FFF8E0`.
Tinted: pure white glyph, body 96% alpha, ear 60%, features fully transparent.

## Geometry (1024 canvas)
Body top edge ≈ y=452, sides x=150..874, cropped by bottom edge. Eyes r=54 at
(372,672)/(652,672); highlights r=19 offset (+18,−18) plus r=9 at (−16,+16). Blush
48×30 ellipses at (266,750)/(758,750). Mouth centered at (512, ~775). Paws 140×130
rounded rects (rx=60) at x=286/598, y=952. Folded ear triangle (700,462)→(874,620)→(706,606).
Everything critical sits inside the HIG safe zone; the system mask never clips the face.

## Files
- masters/icon-light.svg, masters/icon-dark.svg, masters/icon-tinted.svg
- AppIcon.appiconset/Contents.json, icon-light-1024.png, icon-dark-1024.png, icon-tinted-1024.png
