import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_URL = new URL(
  "../characters/t-rex-skeleton-rigged-and-animated/scene.gltf",
  import.meta.url
).href;
const MODEL_ASSETS = new Map([
  [
    "scene.bin",
    new URL("../characters/t-rex-skeleton-rigged-and-animated/scene.bin", import.meta.url).href
  ],
  [
    "textures/Material.Rex_baseColor.png",
    new URL(
      "../characters/t-rex-skeleton-rigged-and-animated/textures/Material.Rex_baseColor.png",
      import.meta.url
    ).href
  ],
  [
    "textures/env-mat_baseColor.png",
    new URL(
      "../characters/t-rex-skeleton-rigged-and-animated/textures/env-mat_baseColor.png",
      import.meta.url
    ).href
  ]
]);

export class Dinosaur {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(-16.5, 0.05, 0);
    this.group.rotation.y = Math.PI * 0.5;
    this.awake = false;
    this.mixer = null;
    this.action = null;
    this.loadModel();
  }

  loadModel() {
    const loadingManager = new THREE.LoadingManager();
    loadingManager.setURLModifier(url => {
      const normalizedUrl = url.replaceAll("\\", "/");

      for (const [relativePath, bundledUrl] of MODEL_ASSETS) {
        if (normalizedUrl.endsWith(relativePath)) {
          return bundledUrl;
        }
      }

      return url;
    });
    const loader = new GLTFLoader(loadingManager);

    loader.load(
      MODEL_URL,
      gltf => {
        const model = gltf.scene;
        model.rotation.x = 0;
        model.updateMatrixWorld(true);

        // Porta il modello alle dimensioni della sala e appoggialo al pavimento.
        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const scale = 3.2 / initialSize.y;
        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -box.min.y, -center.z);

        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.group.add(model);

        if (gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          this.action = this.mixer.clipAction(gltf.animations[0]);
          this.action.enabled = true;
          this.action.paused = !this.awake;
          this.action.play();
        }
      },
      undefined,
      error => {
        console.error("Impossibile caricare il modello del T-Rex:", error);
      }
    );
  }

  awaken() {
    this.awake = true;

    if (this.action) {
      this.action.paused = false;
    }
  }

  update(deltaTime) {
    if (this.awake && this.mixer) {
      this.mixer.update(deltaTime);
    }
  }
}
