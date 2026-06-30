# Technical Project Report

Documento tecnico aggiornato sullo stato corrente del progetto `midnight-museum-the-awakening`.

Scopo del documento: fornire contesto strutturato a ChatGPT, Codex o un altro agente tecnico per capire rapidamente architettura, asset, flusso di esecuzione, materiali, ambientazione e stato specifico delle porte.

## Stack e Runtime

- Framework/rendering: Three.js.
- Build tool: Vite.
- Moduli: ES modules.
- Animazioni temporizzate: `@tweenjs/tween.js`.
- Loader modelli: `GLTFLoader` da `three/addons/loaders/GLTFLoader.js`.
- Entry point: `src/main.js`.
- Script principali:
  - `npm run dev`: avvia Vite in sviluppo.
  - `npm run build`: genera la build in `dist/`.
  - `npm run preview`: preview della build Vite.

Dipendenze da `package.json`:

```json
{
  "@tweenjs/tween.js": "^25.0.0",
  "three": "^0.179.1",
  "vite": "^7.0.0"
}
```

## Struttura Generale

Cartelle principali:

```text
src/
  main.js
  core/
    AssetFactory.js
    CameraManager.js
    InputManager.js
    InteractionManager.js
    Renderer.js
    SceneManager.js
  world/
    Museum.js
    Hall.js
    DinosaurRoom.js
    StatueRoom.js
    EgyptianRoom.js
    GalleryRoom.js
  characters/
    Player.js
    t-rex-skeleton-rigged-and-animated/
  exhibits/
    Clock.js
    Dinosaur.js
    Paintings.js
    Sarcophagus.js
    Statue.js
  systems/
    AnimationSystem.js
    CollisionSystem.js
    LightingSystem.js
    UIController.js
  utils/
    constants.js
    materials.js
    math.js
    proceduralTextures.js

public/
  models/
    Column/ionic_column.glb
    bench/modern_bench_1.glb
    Door/sliding_door.glb
  texture/
    floor/WoodFloor064_2K-JPG_*.jpg
    wall/Concrete030_2K-JPG_*.jpg
```

## Flusso di Avvio

Il file `src/main.js` istanzia:

- `Renderer`
- `SceneManager`
- `CameraManager`
- `InputManager`
- materiali tramite `createMaterials()`
- `AssetFactory`
- `LightingSystem`
- `CollisionSystem`
- `AnimationSystem`
- `Museum`
- `Player`
- `InteractionManager`
- `UIController`

Poi aggiunge alla scena:

```js
sceneManager.scene.add(museum.group, player.group);
```

Gli oggetti animabili vengono registrati in `AnimationSystem`:

```js
animationSystem.addMany([lightingSystem, ...museum.getAnimatables()]);
```

Il render loop aggiorna:

1. tween.js
2. player
3. trigger del museo
4. sistema animazioni
5. camera
6. rendering Three.js

## Architettura del Museo

`src/world/Museum.js` compone l'ambiente:

- Atrio centrale: `Hall`
- Sala dinosauro: `DinosaurRoom`
- Sala statue: `StatueRoom`
- Sala egizia: `EgyptianRoom`
- Galleria quadri: `GalleryRoom`

Il museo mantiene anche il riferimento a:

- `Clock`
- `LightingSystem`
- `SceneManager`

Quando lo stato globale passa a `museumAwakens`:

- il sistema luci riceve `setAwakening(true)`;
- il dinosauro viene risvegliato.

## AssetFactory

`src/core/AssetFactory.js` e' il punto centrale per creare elementi riutilizzabili dell'ambiente.

Funzioni principali:

- `mesh(geometry, material, position, castShadow, receiveShadow)`
- `createFloor(width, depth, position)`
- `createWall(width, height, depth, position)`
- `createColumn(position, height)`
- `createDoorFrame(position, rotationY, width)`
- `createSign(text, position, rotationY, width)`
- `createBench(position, rotationY)`

Nota: il nome `createDoorFrame()` e' storico. Attualmente non crea piu' un frame procedurale: crea una porta GLB.

## Modelli GLB Importati

I modelli GLB sono serviti da `public/`, quindi a runtime sono raggiungibili con path assoluti:

```js
const COLUMN_MODEL_URL = "/models/Column/ionic_column.glb";
const BENCH_MODEL_URL = "/models/bench/modern_bench_1.glb";
const DOOR_MODEL_URL = "/models/Door/sliding_door.glb";
```

Tutti questi modelli vengono caricati in modo asincrono con `GLTFLoader`.

Per ciascun tipo di modello esiste una Promise cache:

- `this.columnModelPromise`
- `this.benchModelPromise`
- `this.doorModelPromise`

Questo evita di ricaricare lo stesso file piu' volte. Ogni istanza visiva e' un clone del modello gia' caricato.

### Fallback Modelli

Non esistono fallback procedurali per:

- colonne
- panchine
- porte

Se un GLB fallisce il caricamento, il gruppo resta vuoto e viene stampato un errore in console.

Questo comportamento e' intenzionale, su richiesta: si vogliono vedere solo i modelli importati.

## Materiali e Texture

I materiali sono centralizzati in `src/utils/materials.js`.

### Pavimento

Il pavimento usa mappe PBR esterne da:

```text
/texture/floor/WoodFloor064_2K-JPG_Color.jpg
/texture/floor/WoodFloor064_2K-JPG_NormalGL.jpg
/texture/floor/WoodFloor064_2K-JPG_Roughness.jpg
```

Configurazione:

- `TextureLoader`
- `RepeatWrapping`
- repeat: `{ x: 8, y: 8 }`
- color map in `THREE.SRGBColorSpace`
- normal e roughness senza sRGB
- materiale: `THREE.MeshStandardMaterial`
- roughness esterna: `0.85`
- metalness esterna: `0.0`

Fallback: texture procedurale floor + normal procedurale.

### Pareti

Le pareti usano mappe PBR esterne da:

```text
/texture/wall/Concrete030_2K-JPG_Color.jpg
/texture/wall/Concrete030_2K-JPG_NormalGL.jpg
/texture/wall/Concrete030_2K-JPG_Roughness.jpg
```

Configurazione:

- `TextureLoader`
- `RepeatWrapping`
- repeat: `{ x: 3, y: 2 }`
- color map in `THREE.SRGBColorSpace`
- normal e roughness senza sRGB
- materiale: `THREE.MeshStandardMaterial`
- roughness esterna: `0.82`
- metalness esterna: `0.0`

Fallback: texture procedurale parete.

### Altri Materiali

Restano procedurali o semplici:

- `wood`
- `sarcophagus`
- `sign`
- `signText`
- `trim`
- `gold`
- `glass`
- `playerCoat`
- `playerSkin`
- materiali statue/ossa

## Geometria delle Stanze

Le stanze sono assemblate con primitive Three.js e asset caricati.

### Dimensioni Logiche

I rettangoli logici delle stanze sono definiti in `src/utils/constants.js`:

- hall: `x [-8, 8]`, `z [-6, 6]`
- dinosaur: `x [-25, -8]`, `z [-6, 6]`
- statue: `x [8, 25]`, `z [-6, 6]`
- egyptian: `x [-8, 8]`, `z [-23, -6]`
- gallery: `x [-8, 8]`, `z [6, 23]`

### Altezza Pareti

Le pareti principali delle sale sono alte `4.8`.

Sono centrate verticalmente a `y = 2.4`, quindi partono da pavimento e arrivano a `y = 4.8`.

Le vecchie pareti da `3.5` sono state sostituite nelle stanze con pareti piu' alte.

### Sopraporta Atrio

In `src/world/Hall.js` sono stati aggiunti pannelli di muro sopra le quattro porte dell'atrio.

Costanti:

```js
const WALL_HEIGHT = 4.8;
const DOOR_HEADER_BOTTOM = 3.35;
const DOOR_HEADER_HEIGHT = WALL_HEIGHT - DOOR_HEADER_BOTTOM;
const DOOR_HEADER_CENTER_Y = DOOR_HEADER_BOTTOM + DOOR_HEADER_HEIGHT / 2;
```

Quindi:

- pannello sopra porta parte da `y = 3.35`;
- arriva fino a `y = 4.8`;
- altezza pannello: `1.45`;
- centro pannello: `4.075`.

Il valore `3.35` e' stato scelto per sovrapporsi leggermente al modello porta alto `3.4` ed eliminare fessure visive.

## Insegne

Le insegne sono create da `AssetFactory.createSign()`.

Implementazione:

- base: `BoxGeometry(width, 0.7, 0.12)` con materiale `sign`;
- testo: Canvas 512x128 convertito in `THREE.CanvasTexture`;
- label: `PlaneGeometry(width * 0.92, 0.52)` con `MeshBasicMaterial`;
- texture testo in `THREE.SRGBColorSpace`.

Le insegne sono state posizionate piu' vicine alle pareti:

- Hall:
  - `DINOSAUR`: `[-7.76, 3.9, 0]`
  - `STATUE`: `[7.76, 3.9, 0]`
  - `EGYPT`: `[0, 3.9, -5.76]`
  - `GALLERY`: `[0, 3.9, 5.76]`
- Sala dinosauro:
  - `[-16.5, 3.1, -5.76]`
- Sala statue:
  - `[16.5, 3.15, -5.76]`
- Sala egizia:
  - `[0, 3.15, -22.76]`
- Galleria:
  - `[0, 3.15, 22.76]`

## Focus Tecnico: Porte

### File Modello

Il modello porta usato nel progetto e':

```text
public/models/Door/sliding_door.glb
```

Runtime URL:

```text
/models/Door/sliding_door.glb
```

Costante in `AssetFactory.js`:

```js
const DOOR_MODEL_URL = "/models/Door/sliding_door.glb";
```

### Creazione Porta

Le porte vengono create tramite:

```js
createDoorFrame(position, rotationY = 0, width = 3.6)
```

Nonostante il nome `DoorFrame`, la funzione oggi crea una porta GLB completa.

Passaggi:

1. crea un `THREE.Group`;
2. applica posizione e rotazione al gruppo;
3. carica il modello porta tramite `loadDoorModel()`;
4. quando la Promise risolve, clona e normalizza il modello tramite `createDoorModelInstance(model, 3.4, width)`;
5. aggiunge il clone al gruppo.

Codice concettuale:

```js
const group = new THREE.Group();
group.position.set(...position);
group.rotation.y = rotationY;

this.loadDoorModel().then(model => {
  group.add(this.createDoorModelInstance(model, 3.4, width));
});
```

### Caricamento Porta

La funzione `loadDoorModel()` usa cache Promise:

```js
if (!this.doorModelPromise) {
  const loader = new GLTFLoader();
  this.doorModelPromise = loader.loadAsync(DOOR_MODEL_URL).then(gltf => {
    const model = gltf.scene;
    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return model;
  });
}
```

Effetto:

- il GLB viene richiesto una volta sola;
- ogni porta usa `model.clone(true)`;
- tutte le mesh del modello castano e ricevono ombre.

### Scaling Porta

La funzione `createDoorModelInstance(model, height, width)` fa scaling non uniforme:

1. clona il modello;
2. misura il bounding box iniziale;
3. scala uniformemente il modello in base all'altezza richiesta;
4. misura di nuovo il bounding box dopo lo scaling in altezza;
5. modifica solo `scale.x` per raggiungere la larghezza desiderata;
6. ricentra il modello;
7. appoggia il modello al pavimento.

Parametri attuali:

```js
height = 3.4
width = 3.6 oppure 4.4
```

Formula altezza:

```js
const scale = height / Math.max(size.y, 0.001);
instance.scale.setScalar(scale);
```

Formula larghezza:

```js
instance.scale.x *= width / Math.max(heightScaledSize.x, 0.001);
```

Posizionamento finale:

```js
const scaledBox = new THREE.Box3().setFromObject(instance);
const center = scaledBox.getCenter(new THREE.Vector3());
instance.position.set(-center.x, -scaledBox.min.y, -center.z);
```

Questo significa che il modello:

- e' centrato orizzontalmente rispetto al proprio gruppo;
- appoggia a `y = 0` nel gruppo;
- eredita posizione e rotazione dal gruppo padre.

### Posizioni Porte in Hall

Le porte sono create solo in `src/world/Hall.js`.

Porte laterali:

```js
factory.createDoorFrame([-8, 0, 0], Math.PI * 0.5, 3.6)
factory.createDoorFrame([8, 0, 0], Math.PI * 0.5, 3.6)
```

Porte nord/sud:

```js
factory.createDoorFrame([0, 0, -6], 0, 4.4)
factory.createDoorFrame([0, 0, 6], 0, 4.4)
```

Le porte laterali sono larghe `3.6` per chiudere l'apertura tra i muri verticali delle sale dinosauro/statue.

Le porte verso egizia/galleria sono larghe `4.4` per chiudere l'apertura tra i due segmenti di muro frontali.

### Sopraporta e Chiusura Fessure

I pannelli sopra le porte dell'atrio sono creati prima delle porte.

Laterali:

```js
factory.createWall(0.35, DOOR_HEADER_HEIGHT, 3.6, [-8, DOOR_HEADER_CENTER_Y, 0])
factory.createWall(0.35, DOOR_HEADER_HEIGHT, 3.6, [8, DOOR_HEADER_CENTER_Y, 0])
```

Nord/sud:

```js
factory.createWall(4.4, DOOR_HEADER_HEIGHT, 0.35, [0, DOOR_HEADER_CENTER_Y, -6])
factory.createWall(4.4, DOOR_HEADER_HEIGHT, 0.35, [0, DOOR_HEADER_CENTER_Y, 6])
```

Il pannello parte da `y = 3.35`, mentre la porta e' alta `3.4`.

Questa sovrapposizione di `0.05` serve a evitare una linea vuota tra porta e muro.

### Materiali della Porta

Il file `sliding_door.glb` non contiene texture immagini incorporate.

Il GLB contiene materiali PBR base:

- `Ebony_mat`: materiale principale molto scuro;
- `Window_Mat`: vetro/trasparente;
- `Silver_mat`: parte metallica, probabilmente maniglia o dettagli.

Conseguenze visive:

- la porta appare nera perche' il materiale principale e' quasi nero;
- le parti metalliche possono apparire poco evidenti perche' la scena non usa environment map HDR;
- la resa metallica dipende molto da luci e riflessi disponibili nella scena.

### Fallback Porta

Non c'e' fallback procedurale.

Se il modello non carica:

- la porta non viene visualizzata;
- in console appare:

```js
console.error("Impossibile caricare il modello della porta:", error);
```

## Colonne

Modello:

```text
/models/Column/ionic_column.glb
```

Creazione:

- `createColumn(position, height = 4.2)`
- gruppo posizionato subito;
- caricamento asincrono;
- clone del modello;
- scaling in altezza a `height + 0.8`;
- centratura e appoggio a terra.

Non esiste fallback procedurale.

## Panchine

Modello:

```text
/models/bench/modern_bench_1.glb
```

Creazione:

- `createBench(position, rotationY = 0)`
- gruppo posizionato e ruotato;
- caricamento asincrono;
- clone del modello;
- scaling sulla dimensione orizzontale massima a `3.4`;
- centratura e appoggio a terra.

Non esiste fallback procedurale.

## T-Rex

Il T-Rex e' ancora gestito separatamente in `src/exhibits/Dinosaur.js`.

Usa:

- `GLTFLoader`
- `LoadingManager` con `setURLModifier`
- modello sorgente in `src/characters/t-rex-skeleton-rigged-and-animated/`
- animazione interna GLTF tramite `THREE.AnimationMixer`

Questo e' l'unico modello importato che porta una animazione interna.

I modelli aggiunti di colonne, panchine e porte non introducono animazioni esterne.

## Animazioni

Sistema centrale:

```text
src/systems/AnimationSystem.js
```

Registra oggetti con metodo `update(deltaTime, elapsedTime)`.

Animabili principali:

- `LightingSystem`
- `Clock`
- `Dinosaur`
- `Statue`
- `Sarcophagus`
- `Paintings`

Le animazioni sono ancora implementate in JavaScript o gestite tramite il mixer del T-Rex.

## Luci

`LightingSystem` crea:

- luce ambientale;
- hemispheric light;
- directional light con ombre;
- point light per ogni stanza;
- spotlight per il dinosauro;
- torce egizie.

Modalita:

- `off`
- `blue`
- `day`

Lo stato `awakening` aumenta/varia alcuni effetti e abilita flickering.

Nota tecnica: i materiali metallici dei GLB, specialmente la porta, possono apparire poco brillanti per assenza di environment map dedicata.

## Collisioni

`CollisionSystem` e' semplice:

- limita il player dentro `MUSEUM_BOUNDS`;
- non implementa collisioni dettagliate con muri, porte, colonne o panchine.

Bounds:

```js
minX: -25.5,
maxX: 25.5,
minZ: -23.5,
maxZ: 23.5
```

## Interazioni

`InteractionManager` registra gli oggetti cliccabili esposti da `Museum.getClickables()`.

Clickabili:

- sarcofago;
- quadri della galleria.

Le porte non sono interattive.

Le porte sono elementi statici caricati come modello GLB.

## Stato Build

Ultima verifica eseguita:

```bash
npm run build
```

Risultato:

- build completata con successo;
- rimane il warning Vite sui chunk grandi oltre 500 kB;
- i modelli in `public/models/` vengono copiati in `dist/models/`;
- le texture in `public/texture/` vengono copiate in `dist/texture/`.

## Note Operative per Futuri Interventi

1. Per modificare forma, scala o asset di porte, colonne e panchine, intervenire prima in `src/core/AssetFactory.js`.
2. Per modificare posizione delle porte, intervenire in `src/world/Hall.js`.
3. Per modificare altezza delle pareti o chiusure sopra porta, intervenire nei file `src/world/*.js`, in particolare `Hall.js` per i pannelli sopraporta.
4. Per texture pavimento/pareti, intervenire in `src/utils/materials.js`.
5. Per aggiungere nuove texture statiche servite da Vite, inserirle in `public/texture/...` e referenziarle con path assoluto `/texture/...`.
6. Per aggiungere nuovi GLB statici, inserirli in `public/models/...` e referenziarli con path assoluto `/models/...`.
7. Evitare di spostare logica in `src/main.js`: l'attuale architettura centralizza asset e costruzione geometrica in `AssetFactory` e nelle classi `world`.

