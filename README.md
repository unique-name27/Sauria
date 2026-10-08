# Sauria

A 3D, third-person remake of **Designasaurus**, the 1987 dinosaur game, in which the
original's three activities and their rules carry over unchanged and only the graphics
are new. It runs in the browser on [three.js](https://threejs.org/) r128, and everything
else (models, plants, skies, sound and print layouts) is generated in code. There are no
image or model files.

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
graphics*, which turns off shadows and lowers the resolution for slow machines.

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
src/art.js      2D props (bushes, paleontologist, filing cabinet)
src/world.js    2D habitat backdrops and head crops for portraits
src/d3.js       turns a species (or a head/body/tail hybrid) into a rigged 3D model; walk/eat/attack animation
src/env3d.js    the five 3D screens, the title valley and the museum lab
src/print.js    species facts, survival scoring, print page layouts and a small PDF writer
src/audio.js    synthesized sound effects and ambience (Web Audio)
src/game3d.js   game state, input, Walk/Build/Print logic, camera and the main loop
build.js        bundler: src/ -> dist/
tests/          Playwright checks and the benchmark
```

## Performance notes

- three r128 never frustum-culls an `InstancedMesh`. To work around that, plants, trees and
  rocks are split into slices along the valley, each with its own bounding sphere, so
  off-screen slices are skipped in both the main pass and the shadow pass.
- Plants use per-vertex Lambert lighting, which is cheap for overlapping alpha-tested cards.
- The fixed parts of each dinosaur (plates, spikes, teeth, toes, eyes) are merged into one
  mesh per joint and material. That's about 15–24 draw calls per dinosaur, down from up to 56.
- Shadows use PCF, not PCF-soft, which takes half the texture reads per pixel.
- Adaptive resolution: if frames take longer than ~21 ms, the render scale drops; when
  there's headroom, it climbs back up. If dropping doesn't help (for example, on a device
  capped at 30 fps), the controller undoes the drop.
- Models that appear partway through a walk are built while the screen is faded out, so
  they don't cause a hitch when they arrive.

## Differences from the original

Mechanics follow the original. Where its exact content wasn't clear, these were filled in
and are easy to change:

- the names of screens 4 and 5 (Desert, Volcano)
- the six species in the Build Dino cabinet
- the list of 18 printable pictures
- the exact numbers for each skill level

Designasaurus was published by Britannica Software. This is an independent fan remake
and has no connection to the original publisher.
