import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const COFFIN_MODEL_URL = new URL("../characters/coffin.glb", import.meta.url).href;
const MUMMY_MODEL_URL = new URL("../characters/mummy.glb", import.meta.url).href;
const COFFIN_TARGET_HEIGHT = 3.35;
const MUMMY_TARGET_HEIGHT = 2.7;
const COFFIN_UPRIGHT_ORIENTATION = new THREE.Matrix4().makeBasis(
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(-1, 0, 0)
);
const COFFIN_TOP_SLIDE_DISTANCE = 0.95;
const COFFIN_TOP_SLIDE_LOCAL_AXIS = new THREE.Vector3(0, 0, -1);
const COFFIN_OPEN_HOLD_DURATION = 5000;

export class Sarcophagus {
  constructor(materials) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.position.set(0, 0, -15);
    this.open = false;
    this.modelRoot = new THREE.Group();
    this.model = null;
    this.mummy = null;
    this.topParts = [];
    this.topSlideState = { distance: 0 };
    this.animationRunning = false;
    this.createModel();
  }

  createModel() {
    this.modelRoot.name = "Upright Coffin";

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, COFFIN_TARGET_HEIGHT, 0.75),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    );
    hitbox.name = "Coffin Click Hitbox";
    hitbox.position.y = COFFIN_TARGET_HEIGHT * 0.5;

    this.group.add(this.modelRoot, hitbox);
    this.loadModel();
  }

  loadModel() {
    const loader = new GLTFLoader();

    loader.load(
      COFFIN_MODEL_URL,
      gltf => {
        const model = gltf.scene;
        model.quaternion.setFromRotationMatrix(COFFIN_UPRIGHT_ORIENTATION);
        model.updateMatrixWorld(true);

        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const scale = COFFIN_TARGET_HEIGHT / Math.max(initialSize.y, 0.001);
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

        this.model = model;
        this.setupTopSlide(model);
        this.applyTopSlide();
        this.modelRoot.add(model);
        this.loadMummy();
      },
      undefined,
      error => {
        console.error("Impossibile caricare il modello del sarcofago:", error);
      }
    );
  }

  loadMummy() {
    const loader = new GLTFLoader();

    loader.load(
      MUMMY_MODEL_URL,
      gltf => {
        const mummy = gltf.scene;
        mummy.updateMatrixWorld(true);

        const initialBox = new THREE.Box3().setFromObject(mummy);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const scale = MUMMY_TARGET_HEIGHT / Math.max(initialSize.y, 0.001);
        mummy.scale.setScalar(scale);
        mummy.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(mummy);
        const center = box.getCenter(new THREE.Vector3());
        mummy.position.set(-center.x, 0.15 - box.min.y, -0.08 - center.z);

        mummy.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        mummy.name = "Mummy Inside Coffin";
        this.mummy = mummy;
        this.modelRoot.add(mummy);
      },
      undefined,
      error => {
        console.error("Impossibile caricare il modello della mummia:", error);
      }
    );
  }

  setupTopSlide(model) {
    this.topParts = [];

    model.traverse(child => {
      if (!child.name.toLowerCase().includes("top")) {
        return;
      }

      this.topParts.push({
        object: child,
        basePosition: child.position.clone()
      });
    });

    if (this.topParts.length === 0) {
      console.warn("Nessuna parte superiore trovata nel modello del sarcofago.");
    }

    this.topSlideState.distance = this.open ? COFFIN_TOP_SLIDE_DISTANCE : 0;
  }

  applyTopSlide() {
    if (!this.model || this.topParts.length === 0) {
      return;
    }

    const modelScale = Math.max(this.model.scale.x, 0.001);
    const localDistance = this.topSlideState.distance / modelScale;
    const offset = COFFIN_TOP_SLIDE_LOCAL_AXIS.clone().multiplyScalar(localDistance);

    this.topParts.forEach(part => {
      part.object.position.copy(part.basePosition).add(offset);
    });
  }

  onClick() {
    this.toggle();
  }

  toggle() {
    if (this.animationRunning || !this.model) {
      return;
    }

    this.animationRunning = true;
    this.open = true;

    const closeTween = new TWEEN.Tween(this.topSlideState)
      .to({ distance: 0 }, 950)
      .delay(COFFIN_OPEN_HOLD_DURATION)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => this.applyTopSlide())
      .onComplete(() => {
        this.open = false;
        this.animationRunning = false;
      });

    const openTween = new TWEEN.Tween(this.topSlideState)
      .to({ distance: COFFIN_TOP_SLIDE_DISTANCE }, 950)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => this.applyTopSlide())
      .onComplete(() => {
        TWEEN.add(closeTween);
        closeTween.start();
      });

    TWEEN.add(openTween);
    openTween.start();
  }

  update() {}
}
