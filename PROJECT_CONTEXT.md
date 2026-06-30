# Technical Project Context for ChatGPT

## Project Identity

Project title: Midnight Museum: The Awakening

This repository contains a base interactive graphics project built from scratch with JavaScript, Three.js, tween.js and Vite. The theme is a night museum where exhibits awaken at midnight. The project is intentionally asset-free: no imported 3D models, no imported animation files and no external image textures. All visible objects are built in code using Three.js primitive geometries or compositions of primitives. All animations are implemented in JavaScript through the render loop, tween.js or both.

The project language is modern JavaScript using ES modules.

## Runtime and Commands

Main commands:

```bash
npm install
npm run dev
npm run build
npm run preview
```

The development server is powered by Vite. The default local URL is usually:

```text
http://localhost:5173/
```

On this Windows machine, Node exists under:

```text
C:\Program Files\nodejs
```

If `npm` is not visible in PowerShell, temporarily prepend Node to the session PATH:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
```

## Dependencies

Runtime dependencies:

```json
{
  "three": "^0.179.1",
  "@tweenjs/tween.js": "^25.0.0"
}
```

Dev dependency:

```json
{
  "vite": "^7.0.0"
}
```

The project has no frontend framework such as React, Vue or Angular.

## Current File Structure

```text
src/
  main.js

  core/
    Renderer.js
    SceneManager.js
    CameraManager.js
    InputManager.js
    InteractionManager.js
    AssetFactory.js

  world/
    Museum.js
    Hall.js
    DinosaurRoom.js
    StatueRoom.js
    EgyptianRoom.js
    GalleryRoom.js

  characters/
    Player.js

  exhibits/
    Dinosaur.js
    Statue.js
    Sarcophagus.js
    Paintings.js
    Clock.js

  systems/
    AnimationSystem.js
    LightingSystem.js
    CollisionSystem.js
    UIController.js

  utils/
    constants.js
    materials.js
    proceduralTextures.js
    math.js
```

Root files:

```text
index.html
package.json
package-lock.json
README.md
.gitignore
PROJECT_CONTEXT.md
```

## Main Bootstrap Flow

Entry point: `src/main.js`

Current initialization order:

1. Create `Renderer`
2. Create `SceneManager`
3. Create `CameraManager`
4. Create `InputManager`
5. Create procedural materials through `createMaterials()`
6. Create `AssetFactory`
7. Create `LightingSystem`
8. Create `CollisionSystem`
9. Create `AnimationSystem`
10. Create `Museum`
11. Create `Player`
12. Create `InteractionManager`
13. Create `UIController`
14. Add museum and player groups to the scene
15. Register animatable objects
16. Register clickable objects
17. Bind keyboard and UI events
18. Start the requestAnimationFrame loop

Main loop order:

```js
TWEEN.update(time);
player.update(deltaTime, elapsedTime);
museum.updateTriggers(player);
animationSystem.update(deltaTime, elapsedTime);
cameraManager.update(player, deltaTime, elapsedTime);
renderer.render(sceneManager.scene, cameraManager.camera);
```

This order is important: player movement is updated before proximity triggers, then global animatables and camera are updated.

## Rendering

File: `src/core/Renderer.js`

The renderer uses:

- `THREE.WebGLRenderer`
- antialiasing enabled
- ACES Filmic tone mapping
- `THREE.SRGBColorSpace`
- soft shadow maps with `THREE.PCFSoftShadowMap`
- responsive resize handling
- quality presets through `setQuality(quality)`

Quality levels are defined in `src/utils/constants.js`:

```js
low: { pixelRatio: 0.85, shadows: false }
medium: { pixelRatio: 1.25, shadows: true }
high: { pixelRatio: 1.75, shadows: true }
```

## Scene State

File: `src/core/SceneManager.js`

`SceneManager` extends `EventTarget`. It owns:

- `scene`
- background color
- fog
- global museum state

Museum states are defined in `src/utils/constants.js`:

```js
quiet
awakening
```

When `setAwakening()` is called, it dispatches a `museumAwakens` event. The museum and UI listen to that event.

## Input

File: `src/core/InputManager.js`

The input system stores currently pressed keys in a `Set`. It dispatches:

- `keyPressed`
- `click`

Mouse click coordinates are normalized to clip space and passed to the interaction system.

The original absolute movement vector method still exists as `getMovementVector()`, but the current player movement does not use it. Current movement reads keys directly through `isDown()`.

## Current Player Controls

File: `src/characters/Player.js`

The player is a visible hierarchical model built with primitives:

- group root
- capsule body
- sphere head
- cylinder hat
- two capsule arms
- two capsule legs

Current movement model is third-person/tank-style:

```text
W = move forward relative to player orientation
S = move backward relative to player orientation
A = rotate left
D = rotate right
```

Arrow keys are intentionally not used for player movement anymore.

Important current movement properties:

```js
this.speed = 5.4;
this.turnSpeed = 2.8;
```

Movement direction is computed from the player's current Y rotation:

```js
const forward = new THREE.Vector3(
  Math.sin(this.group.rotation.y),
  0,
  Math.cos(this.group.rotation.y)
);
```

The player is constrained by `CollisionSystem.constrain()`.

The walking animation is procedural:

- arms and legs swing using `Math.sin(this.walkTime)`
- body bobs slightly when moving
- head has a small idle rotation

## Camera

File: `src/core/CameraManager.js`

There are three camera modes:

```text
thirdPerson
topDown
panorama
```

Camera labels are defined in `src/utils/constants.js`.

The `C` key cycles the camera mode.

Third-person camera follows the player from behind using the player's Y rotation. Top-down camera follows from above. Panorama camera orbits around the museum center automatically.

## Mouse Interaction

File: `src/core/InteractionManager.js`

Interaction uses:

- `THREE.Raycaster`
- normalized pointer coordinates from `InputManager`
- a set of registered clickable meshes

Clickable objects expose an `onClick()` method or equivalent target object. `InteractionManager.register(object, target)` traverses the object's children and assigns `child.userData.clickable = target`.

Currently clickable:

- sarcophagus
- paintings

## AssetFactory

File: `src/core/AssetFactory.js`

`AssetFactory` centralizes reusable primitive construction:

- floors
- walls
- columns
- door frames
- signs
- benches
- generic mesh helper

Signs are built using a `CanvasTexture` generated at runtime. No external font files or images are used.

## Museum Layout

File: `src/world/Museum.js`

The museum contains:

- central atrium
- dinosaur room
- statue room
- Egyptian room
- gallery room

Room rectangles and global bounds are defined in `src/utils/constants.js`.

Approximate layout:

```text
                 Gallery
                   |
Dinosaur Room -- Atrium -- Statue Room
                   |
              Egyptian Room
```

The museum owns references to major exhibits through room instances:

```js
this.dinosaurRoom.dinosaur
this.statueRoom.statue
this.egyptianRoom.sarcophagus
this.galleryRoom.paintings
this.clock
```

`Museum.getAnimatables()` returns objects registered with `AnimationSystem`.

`Museum.getClickables()` returns objects registered with `InteractionManager`.

`Museum.updateTriggers(player)` handles proximity triggers:

- dinosaur awakens when player enters dinosaur room rectangle
- statue reacts when player gets close
- paintings react to nearby player
- Egyptian torches are boosted when player enters Egyptian room

The museum listens to `museumAwakens` and triggers lighting awakening plus dinosaur awakening.

## Rooms

### Hall

File: `src/world/Hall.js`

Central room containing:

- floor
- four walls with door gaps simulated by partial wall layout and frames
- signs toward each wing
- columns
- benches
- clock mounted in atrium

### DinosaurRoom

File: `src/world/DinosaurRoom.js`

Contains:

- room floor and walls
- columns
- sign
- decorative rail cylinders
- `Dinosaur` exhibit

### StatueRoom

File: `src/world/StatueRoom.js`

Contains:

- floor and walls
- sign
- columns
- bench
- `Statue` exhibit

### EgyptianRoom

File: `src/world/EgyptianRoom.js`

Contains:

- floor and walls
- sign
- obelisks built from boxes and cones
- torch holders
- torches created through `LightingSystem.createTorch()`
- `Sarcophagus` exhibit

### GalleryRoom

File: `src/world/GalleryRoom.js`

Contains:

- floor and walls
- sign
- bench
- columns
- `Paintings` exhibit group

## Exhibits

### Dinosaur

File: `src/exhibits/Dinosaur.js`

The dinosaur is a hierarchical primitive model with this structure:

```text
dinosaurGroup
  body
  neckGroup
    neck
    headGroup
      skull
      jaw
  tailGroup
    tail
  leftLegGroup
  rightLegGroup
  leftArmGroup
  rightArmGroup
  spine meshes
```

It is built from:

- `CapsuleGeometry`
- `BoxGeometry`
- `ConeGeometry`

Animation:

- idle tail and head movement with `Math.sin`
- awaken animation via tween.js:
  - neck lowers
  - head moves
  - jaw opens and closes
  - tail swings

Awakening can be triggered by:

- entering the dinosaur room
- global `museumAwakens` event

### Statue

File: `src/exhibits/Statue.js`

Primitive hierarchical statue:

- base
- pedestal
- torso
- head group
- left arm
- right arm

When the player is close:

- head turns toward player
- right arm raises and returns via tween.js

### Sarcophagus

File: `src/exhibits/Sarcophagus.js`

Primitive interactive sarcophagus:

- base
- inner box
- lid pivot group
- lid mesh
- decorative face
- internal point light

Click behavior:

- `onClick()` calls `toggle()`
- lid opens/closes via tween.js
- internal warm light fades in/out via tween.js
- when open, the internal light flickers using `Math.sin`

### Paintings

File: `src/exhibits/Paintings.js`

The gallery contains four paintings. Each painting has:

- wooden frame
- plane surface with procedural `CanvasTexture`
- transparent glass plane

Proximity behavior:

- nearest painting reacts if the player is within range
- reaction adds emissive glow and slight oscillation

Click behavior:

- clicking a painting changes its procedural texture by generating a new canvas texture with a different seed

### Clock

File: `src/exhibits/Clock.js`

The atrium clock contains:

- cylinder rim
- circle face
- hour hand
- minute hand
- hour markers

At startup, the clock hands move quickly until midnight. When they reach midnight:

```js
this.onMidnight?.();
```

In `Museum`, this callback triggers:

```js
sceneManager.setAwakening()
```

## Animation System

File: `src/systems/AnimationSystem.js`

Simple centralized animation registry.

Animatable objects are objects exposing:

```js
update(deltaTime, elapsedTime)
```

Registered current animatables:

- `LightingSystem`
- `Clock`
- `Dinosaur`
- `Statue`
- `Sarcophagus`
- `Paintings`

`Player` is updated separately in `main.js`, before museum triggers.

## Lighting System

File: `src/systems/LightingSystem.js`

The lighting system currently supports two modes:

```text
off
day
```

The UI exposes these labels:

```text
Luci off
Luci giorno
```

The `L` key cycles:

```text
off -> day -> off
```

Current lighting objects:

- ambient light
- room point lights
- Egyptian torch point lights
- dinosaur spotlight

The system stores mode in:

```js
this.mode
```

Mode is set through:

```js
lightingSystem.setMode(mode)
```

Mode is cycled through:

```js
lightingSystem.cycleMode()
```

Mode behavior:

- `off`: very dark scene, point lights off, tiny ambient value
- `day`: bright white/warm indoor lighting, brighter background and lighter fog

The system also changes:

- `scene.background`
- `scene.fog.color`
- `scene.fog.density`
- ambient color/intensity
- room light colors and intensities
- torch colors and intensities
- dinosaur spotlight color/intensity

Awakening mode:

```js
lightingSystem.setAwakening(true)
```

This enables flickering and adjusts dinosaur spotlight intensity according to the active light mode.

Potential implementation caveat:

`boostEgyptianTorches(active)` changes `light.userData.baseIntensity` for torches. Because `setMode()` derives intensity from `baseIntensity`, torch boost persists through current mode calculations. This is acceptable for current behavior, but if more precise light state is needed later, separate base torch intensity and room-trigger boost multiplier.

## Collision System

File: `src/systems/CollisionSystem.js`

The current collision system is simple and only constrains the player within rectangular global museum bounds:

```js
MUSEUM_BOUNDS
```

It does not yet implement detailed wall collision. The player can move through some interior walls if geometry placement allows it, but cannot leave the overall museum rectangle.

Potential extension:

- Add wall colliders per room
- Add door pass-through areas
- Add exhibit collision volumes

## UI System

File: `src/systems/UIController.js`

The UI is plain HTML injected into `#ui-root` from `index.html`.

No external UI library is used.

Current UI shows:

- title
- movement controls
- camera command
- light command
- click interaction command
- current camera mode
- current light mode
- current museum state
- light mode select
- shadow toggle button
- quality select

Current UI events:

```js
lightModeChanged
toggleShadows
qualityChanged
```

Current methods:

```js
setCamera(label)
setLightMode(mode)
setMuseumState(state)
setShadows(enabled)
refresh()
```

## Procedural Materials and Textures

Files:

```text
src/utils/materials.js
src/utils/proceduralTextures.js
```

Texture generation uses HTML canvas and `THREE.CanvasTexture`.

Current procedural textures:

- floor tile/marble-like texture
- wall texture
- wood texture
- normal texture for floor
- painting texture with seed-based abstract pattern
- sarcophagus texture with symbolic decorations

Material factory:

```js
createMaterials()
```

Current material keys:

```text
floor
wall
trim
wood
bone
darkBone
statue
gold
sarcophagus
glass
playerCoat
playerSkin
sign
signText
```

## Constants and Utilities

File: `src/utils/constants.js`

Contains:

- camera modes and labels
- museum states
- museum bounds
- room rectangles
- quality settings
- shared colors

File: `src/utils/math.js`

Contains:

- `clamp`
- `lerp`
- `damp`
- `distance2D`
- `withinRect`
- `angleTo`
- `normalizedDirection`

Not all utility functions are currently used after recent control changes.

## Current Controls

Keyboard:

```text
W = move forward relative to player orientation
S = move backward relative to player orientation
A = rotate left
D = rotate right
C = cycle camera mode
L = cycle light mode
```

Mouse:

```text
Click sarcophagus = open/close lid
Click painting = regenerate painting texture
```

UI:

```text
Light select = off / day
Shadow button = toggle shadows
Quality select = low / medium / high
```

## Recent Changes

Important changes already made after initial creation:

1. Player movement was changed from absolute WASD movement to third-person/tank-style controls.
2. Arrow keys were removed from player movement.
3. `A` and `D` rotation direction was corrected so:
   - `A` rotates left
   - `D` rotates right
4. Lighting changed from boolean on/off to two selectable modes:
   - `off`
   - `day`
5. The UI light control changed from a button to a select dropdown.
6. `L` now cycles the two light modes.

## Verification Status

The project has been built successfully after recent changes with:

```bash
npm run build
```

Vite emits a warning that the final JavaScript chunk is larger than 500 kB. This is expected because Three.js is bundled. It is not currently treated as an error.

The local dev server has previously responded successfully with HTTP 200 at:

```text
http://127.0.0.1:5173/
```

## Technical Constraints to Preserve

Future changes should preserve these constraints unless explicitly requested otherwise:

- No imported GLTF, OBJ, FBX or other 3D models
- No imported animation files
- No required external image textures
- Prefer primitive geometry and procedural `CanvasTexture`
- Keep code modular
- Keep `src/main.js` as orchestration/bootstrap only
- Put object-specific logic inside the appropriate class
- Use tween.js for explicit timed transitions
- Use `update(deltaTime, elapsedTime)` for procedural animation
- Do not introduce a frontend framework unless explicitly requested

## Good Future Extension Points

Suggested extension areas:

- Add detailed wall collision and door pass-through logic
- Add labels/cards near exhibits
- Add a minimap or room name indicator
- Improve day/night transitions with tweened light mode changes
- Add more exhibit animations
- Add audio generated procedurally or Web Audio API ambience
- Add a simple objective system
- Add a pause/help overlay
- Add more procedural texture variety
- Add object outlines or hover feedback for clickable objects
- Add orbit controls only for panorama/debug mode if desired

## Files Most Likely to Be Modified Next

For movement changes:

```text
src/characters/Player.js
src/core/InputManager.js
src/core/CameraManager.js
```

For lighting changes:

```text
src/systems/LightingSystem.js
src/systems/UIController.js
src/main.js
```

For new rooms or room layout:

```text
src/world/Museum.js
src/world/Hall.js
src/world/DinosaurRoom.js
src/world/StatueRoom.js
src/world/EgyptianRoom.js
src/world/GalleryRoom.js
src/utils/constants.js
```

For exhibit behavior:

```text
src/exhibits/Dinosaur.js
src/exhibits/Statue.js
src/exhibits/Sarcophagus.js
src/exhibits/Paintings.js
src/exhibits/Clock.js
```

For materials/textures:

```text
src/utils/materials.js
src/utils/proceduralTextures.js
```

## Mental Model for Future ChatGPT Work

Think of this project as a small custom Three.js game-like scene, not as a normal website. The UI is only an overlay. The core experience is the 3D world and interactive museum behavior.

When adding features, follow the existing structure:

- reusable scene primitives go in `AssetFactory`
- world layout goes in `world`
- autonomous exhibit models and interactions go in `exhibits`
- global mechanics go in `systems`
- player-specific behavior goes in `characters/Player.js`
- shared math/constants/materials go in `utils`
- `main.js` wires systems together and runs the loop

Prefer small targeted modules over putting behavior directly in `main.js`.
