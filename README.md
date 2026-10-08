# Sauria

A 3D, third-person remake of **Designasaurus**, the 1987 dinosaur game, in which the
original's three activities and their rules carry over unchanged and only the graphics
are new. The world and its dinosaurs are built from small voxels: the ground is a grid of
quarter-size blocks, and each dinosaur is made of cubes about a tenth of a unit wide. It runs
in the browser on [three.js](https://threejs.org/) r128, and everything else (voxel models,
plants, skies, sound and print layouts) is generated in code. There are no image or model files.

## The three activities

**Walk Dino.** Pick a Stegosaurus, Brontosaurus or Tyrannosaurus (or a dinosaur you built)
and walk it through five screens: Forest, Swamp, Mountains, Desert and Volcano. Your
calorie bar always drains, and it drains faster while you walk.

- Plant-eaters eat by stopping with their mouth at a bush. Each bush runs out.
- A T. rex eats the dinosaurs that wander past.
- Predators (Allosaurus or T. rex) hunt plant-eaters on some screens. To escape, run, or
  walk back to the previous screen.
- If you starve or get eaten, the walk is over. If you make it through all five screens,
  you get a Hall of Fame certificate that you can save as a PDF.
- There are three skill levels. Higher levels give you fewer bushes, faster calorie burn
  and more predators.

**Build Dino.** The museum paleontologist's filing cabinet holds drawers of heads, bodies
and tails from six species. Mix and match them, then name your hybrid and see its survival
chance with the reasons behind it. You can walk the hybrid in Walk Dino or print it.

**Print Dino.** Choose from 18 dinosaur pictures, plus any you designed, each with a fact
sheet. Print as a regular page, a 4-page poster or a mirrored T-shirt transfer, in colour
or as line art for colouring in. The output is a PDF.

## Controls

| Action | Mouse / keyboard | Touch |
| --- | --- | --- |
| Walk | Move the pointer and the dinosaur walks toward it, or use WASD / arrow keys | Touch and hold where you want to go |
| Turn the camera | Right-drag, or Q and E | |
| Zoom | Mouse wheel | |
| Pause | Esc or the Pause button | Pause button |
| Mute | M | Pause menu |

The pause menu has two options: *walk only while holding the mouse button* and *Fast
graphics*, which turns off shadows, lowers the resolution and shortens the view distance for
slow machines.

## Run it

`dist/index.html` is the whole game in a single file. Open it in a browser, or serve the
repo with GitHub Pages. It loads three.js from cdnjs and its fonts from Google Fonts, so
it needs an internet connection.

```sh
npm run build        # bundles src/ into dist/
```

`dist/sauria.html` is the same game without the `<html>` wrapper. That is the form
published as a Claude artifact.

## Tests

The tests drive the real game in headless Chromium with software WebGL.

```sh
npm install
npx playwright install chromium
npm test             # gameplay checks for every mechanic + phone layouts
npm run bench        # draw calls / triangles / render time per screen
```

Screenshots and a sample PDF are written to `test-output/`. If you're offline, set
`NO_FONTS=1` to stub out the font requests.

## Layout

```
src/page.html   markup, styles and all screens (HUD, pause, game over, Hall of Fame, museum, print desk)
src/lib.js      2D canvas painting helpers (noise, plants, rocks, UI chips)
src/dino.js     18 species as spline skeletons, plus the 2D renderer used for pictures, thumbnails and prints
src/vox.js      voxel engine: voxel sets, meshing with corner shading, voxelizing jointed models, terrain
src/art.js      2D props (bushes, paleontologist, filing cabinet)
src/world.js    2D habitat backdrops and head crops for portraits
src/d3.js       turns a species (or a head/body/tail hybrid) into a rigged 3D model, then into voxels joint by joint; walk/eat/attack animation
src/env3d.js    the five voxel screens, the title valley, the choose stage and the museum lab
src/print.js    species facts, survival scoring, print page layouts and a small PDF writer
src/audio.js    synthesized sound effects and ambience (Web Audio)
src/game3d.js   game state, input, Walk/Build/Print logic, camera and the main loop
build.js        bundler: src/ -> dist/
tests/          Playwright checks and the benchmark
```

## How the voxels are built

- **Dinosaurs**: each species is first built as a smooth jointed model from its 2D spine
  rig. The model is then sampled into voxels separately for every joint (body, neck, tail,
  each leg segment), so the voxel dinosaur still walks, grazes and bites. Hybrids from
  Build Dino go through the same steps.
- **Ground**: the ground is made of columns of 0.25-unit blocks near the path, 0.5-unit
  blocks on the valley walls and 1.5-unit blocks on the distant ranges. Columns with the
  same height and type are merged into larger faces, so flat ground costs little to draw.
  A shader varies each block's shade and adds rock strata on cliffs.
- **Plants, trees and rocks**: these are voxel models built once, then instanced in slices
  along the valley. Each slice is drawn at full detail up close, at half resolution further
  away, and not at all past the fog.
- **Shading**: every cube corner is darkened by the blocks around it (ambient occlusion),
  and the sun casts real shadows.

## Performance notes

- three r128 never frustum-culls an `InstancedMesh`, so props are split into slices with
  their own bounds, and off-screen slices are skipped in the main and shadow passes.
- Everything is opaque. There are no alpha-tested plant cards, so there is little overdraw.
- Shadows use PCF, not PCF-soft.
- Adaptive resolution: if frames take longer than ~21 ms, the render scale drops, but not
  below 0.75 so the voxels stay crisp. When there's headroom, it climbs back up.
- Models that appear partway through a walk are built while the screen is faded out.

## Differences from the original

Mechanics follow the original. Where its exact content wasn't clear, these were filled in
and are easy to change:

- the names of screens 4 and 5 (Desert, Volcano)
- the six species in the Build Dino cabinet
- the list of 18 printable pictures
- the exact numbers for each skill level

Designasaurus was published by Britannica Software. This is an independent fan remake
and has no connection to the original publisher.
