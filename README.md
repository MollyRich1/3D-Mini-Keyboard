# Little Keys

A tiny, playable mechanical keyboard. A standalone creative coding experiment built with React, TypeScript, Vite, Three.js, React Three Fiber, and Drei.

## Run locally

Requires Node.js 22.18+ (or a current supported Node LTS).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

## Play

- Click or touch any of the thirteen keycaps. Hold to keep a key depressed.
- Type **Esc, 1, 2, 3, Shift, Q, W, E, Space, Enter, ←, ↓, →**. Up also activates E, accommodating the reference image's up-arrow position.
- Chords work independently; both Shift keys can be held together.
- Drag the empty space around the object to orbit. Scroll or pinch to zoom.
- **Reset view** smoothly restores the original camera.
- **Sound** enables procedural mechanical clicks; it starts muted.
- **About** includes native button alternatives for keyboard and assistive-technology access.

## How it is built

- `src/layout.ts` defines positions, dimensions, colors, legends, and physical key mappings.
- `src/geometry.ts` builds the caps from lofted rounded outlines, tapered walls, beveled shoulders, and subdivided dished tops. The ISO-style Enter uses a concave L-shaped outline. Legends are local canvas textures; there are no model or texture downloads. The case has its own rounded, extruded slabs.
- `src/KeyboardScene.tsx` contains `Keycap`, `KeyboardCase`, and camera components. Each key runs a stable, substepped damped spring for 0.22 units of travel. Soft contact shadows and warm directional lighting give the object depth.
- `src/input.ts` tracks input sources independently, so releasing one physical Shift key or pointer does not release another held source.
- `src/App.tsx` connects physical and pointer input, releases keys on blur, manages sound and the minimal interface, and provides a WebGL error fallback.
- `src/sound.ts` synthesizes a short noise transient and low body tone with Web Audio. Wide keys have a lower pitch.

## Verification

`npm test` covers chords, overlapping input sources, repeat suppression, and clearing held input. `npm run build` checks TypeScript and creates the production output.

Browser checks covered all thirteen pointer targets, physical keyboard input, sound toggle, orbit and camera reset, and desktop/mobile layout. The application reported no browser runtime errors during these checks.

## Limits and future experiments

- WebGL is required. Rendering quality and frame rate depend on the device GPU. Pixel ratio is capped at 2.
- Font styling uses Google Fonts with local system fallbacks. Keyboard models, legends, and sound are generated locally and require no asset service.
- The initial JavaScript payload includes the 3D engine (about 330 KB gzipped); this is a client-only application with no server or database.
- Audio is synthesized rather than sampled from a particular switch. Sound quality has not been verified by listening through the user's speakers.
- Physical keyboard shortcuts reserved by the browser or operating system remain reserved. Multitouch is handled through per-pointer input sources, but has not been tested on a physical touch device.
- Possible next visual experiments: subtle molded-plastic microtexture, alternate switch sound profiles, and a slow animated light preset. The layout data and procedural geometry are ready for palette and proportion experiments.
