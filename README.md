# Midnight Museum: The Awakening

Progetto base di Interactive Graphics in JavaScript con Three.js, tween.js e Vite.

La scena rappresenta un museo notturno diviso in atrio centrale, sala dinosauro, sala statue, sala egizia e galleria quadri. Il player controlla un piccolo guardiano e puo esplorare il museo mentre i reperti iniziano a reagire alla mezzanotte.

## Avvio

```bash
npm install
npm run dev
npm run build
```

## Controlli

- W / S: avanti e indietro rispetto alla direzione del player
- A / D: rotazione del player anche da fermo
- C: cambio camera tra terza persona, dall'alto e panoramica
- L: accensione e spegnimento luci
- Click mouse: interazione con sarcofago e quadri
- Pannello UI: luci, ombre e qualita

## Requisiti coperti

- JavaScript moderno con ES modules
- Three.js per rendering, camera, luci, geometrie e materiali
- @tweenjs/tween.js per animazioni temporizzate
- Vite come dev server e build tool
- Modello T-Rex GLTF riggato con la sua animazione incorporata
- Texture procedurali create con CanvasTexture
- Player gerarchico con camminata, rotazione e limiti di movimento
- Tre modalita camera
- T-Rex scheletrico riggato e animato tramite AnimationMixer
- Statua gerarchica con testa e braccio animati
- Sarcofago cliccabile con coperchio animato e luce interna
- Galleria con quattro quadri procedurali reattivi
- Orologio che avvia lo stato globale museumAwakens
- Sistema luci con ambiente notturno, spotlight, point light, torce e flickering
- Raycasting mouse per oggetti cliccabili
- Trigger di prossimita per sale e reperti
- UI HTML sovrapposta
- AnimationSystem con oggetti animabili tramite update(deltaTime, elapsedTime)
- CollisionSystem semplice basato sui confini del museo

## Struttura

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

## Note

Gli elementi del museo, escluso il T-Rex importato, sono composizioni di primitive Three.js. Le animazioni sono gestite tramite render loop, tween.js e AnimationMixer. Le texture di pavimento, pareti, legno, quadri e sarcofago sono generate proceduralmente via canvas.

Il modello del T-Rex e basato su ["T-rex-skeleton-rigged-and-animated"](https://sketchfab.com/3d-models/t-rex-skeleton-rigged-and-animated-cca5cf48215142db91f657053bd74057) di [felixjoshua10251025](https://sketchfab.com/felixjoshua10251025), distribuito con licenza [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/).
