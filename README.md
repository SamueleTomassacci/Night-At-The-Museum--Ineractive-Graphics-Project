# Night at the Museum

Base Interactive Graphics project in JavaScript with Three.js, tween.js and Vite.

The scene is a night museum divided into a central atrium, dinosaur room, statue room, Egyptian room and painting gallery. The player controls a small guard and can explore the museum while the exhibits begin to react at midnight.

## Run

```bash
npm install
npm run dev
npm run build
```

## Controls

- W / S: move forward and backward relative to the player's direction
- A / D: rotate the player even while standing still
- C: switch camera between third person, first person, top-down and panorama
- L: turn lights on and off
- Mouse click: interact with the sarcophagus and paintings
- UI panel: lights, shadows and quality

## Covered Requirements

- Modern JavaScript with ES modules
- Three.js for rendering, cameras, lights, geometries and materials
- @tweenjs/tween.js for timed animations
- Vite as dev server and build tool
- Rigged GLTF T-Rex model with its embedded animation
- GLB column model used for the atrium columns
- GLB bench model used for the museum benches
- Procedural atrium doors built with Three.js primitives and animated with tween.js
- Procedural textures created with CanvasTexture, plus static ambientCG WoodFloor064 PBR maps for the floor and Concrete030 maps for the walls
- Hierarchical player with walking, rotation and movement limits
- Four camera modes
- Rigged skeletal T-Rex animated through AnimationMixer
- Hierarchical statue with animated head and arm
- Clickable sarcophagus with animated lid and internal light
- Gallery with four reactive procedural paintings
- Clock that starts the global museumAwakens state
- Lighting system with night ambience, spotlights, point lights, flashlights and flickering
- Mouse raycasting for clickable objects
- Proximity triggers for rooms and exhibits
- Overlay HTML UI
- AnimationSystem with animatable objects through update(deltaTime, elapsedTime)
- Simple CollisionSystem based on museum boundaries

## Structure

```text
src/
  main.js
  core/
    renderer.js
    SceneManager.js
    CameraManager.js
    InputManager.js
    InteractionManager.js
    factory.js
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

## Notes

The museum elements, except for the imported T-Rex and the GLB models for columns, benches and chandeliers, are compositions of Three.js primitives. Animations are handled through the render loop, tween.js and AnimationMixer; the added GLB models do not introduce external animations. Wood and sarcophagus textures are generated procedurally through canvas, while the paintings use images in `src/images`. The floor uses static ambientCG WoodFloor064 PBR maps in `src/texture/floor/`; the walls use static ambientCG Concrete030 PBR maps in `src/texture/wall/`. Both use `Color`, `NormalGL` and `Roughness` maps directly.

The T-Rex model is based on ["T-rex-skeleton-rigged-and-animated"](https://sketchfab.com/3d-models/t-rex-skeleton-rigged-and-animated-cca5cf48215142db91f657053bd74057) by [felixjoshua10251025](https://sketchfab.com/felixjoshua10251025), distributed under the [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) license.
