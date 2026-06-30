import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const COLUMN_MODEL_URL = "/models/Column/ionic_column.glb";
const BENCH_MODEL_URL = "/models/bench/modern_bench_1.glb";
const DOOR_MODEL_URL = "/models/Door/sliding_door.glb";

export class AssetFactory {
  constructor(materials) {
    this.materials = materials;
    this.columnModelPromise = null;
    this.benchModelPromise = null;
    this.doorModelPromise = null;
  }

  mesh(geometry, material, position = [0, 0, 0], castShadow = true, receiveShadow = true) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    return mesh;
  }

  createFloor(width, depth, position = [0, 0, 0]) {
    const mesh = this.mesh(new THREE.BoxGeometry(width, 0.16, depth), this.materials.floor, [position[0], -0.08, position[2]], false, true);
    return mesh;
  }

  createWall(width, height, depth, position) {
    return this.mesh(new THREE.BoxGeometry(width, height, depth), this.materials.wall, position, true, true);
  }

  createColumn(position, height = 4.2) {
    const group = new THREE.Group();
    group.position.set(...position);

    this.loadColumnModel()
      .then(model => {
        group.add(this.createColumnModelInstance(model, height + 0.8));
      })
      .catch(error => {
        console.error("Impossibile caricare il modello della colonna:", error);
      });

    return group;
  }

  loadColumnModel() {
    if (!this.columnModelPromise) {
      const loader = new GLTFLoader();
      this.columnModelPromise = loader.loadAsync(COLUMN_MODEL_URL).then(gltf => {
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

    return this.columnModelPromise;
  }

  createColumnModelInstance(model, height) {
    const instance = model.clone(true);
    const box = new THREE.Box3().setFromObject(instance);
    const size = box.getSize(new THREE.Vector3());
    const scale = height / Math.max(size.y, 0.001);

    instance.scale.setScalar(scale);
    instance.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3().setFromObject(instance);
    const center = scaledBox.getCenter(new THREE.Vector3());
    instance.position.set(-center.x, -scaledBox.min.y, -center.z);

    return instance;
  }

  createDoorFrame(position, rotationY = 0, width = 3.6) {
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.y = rotationY;
    group.userData.isDoor = true;
    group.userData.doorVisual = null;
    group.userData.isOpen = false;
    group.userData.isAnimating = false;
    group.userData.ready = false;
    group.userData.closedPosition = new THREE.Vector3();
    group.userData.openPosition = new THREE.Vector3(width * 0.42, 0, 0);
    group.userData.autoCloseTimeout = null;

    this.loadDoorModel()
      .then(model => {
        const doorVisual = this.createDoorModelInstance(model, 3.4, width);
        group.add(doorVisual);
        group.userData.doorVisual = doorVisual;
        group.userData.closedPosition.copy(doorVisual.position);
        group.userData.openPosition.copy(doorVisual.position).add(new THREE.Vector3(width * 0.42, 0, 0));
        group.userData.ready = true;
      })
      .catch(error => {
        console.error("Impossibile caricare il modello della porta:", error);
      });

    return group;
  }

  loadDoorModel() {
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

    return this.doorModelPromise;
  }

  createDoorModelInstance(model, height, width) {
    const instance = model.clone(true);
    const box = new THREE.Box3().setFromObject(instance);
    const size = box.getSize(new THREE.Vector3());
    const scale = height / Math.max(size.y, 0.001);

    instance.scale.setScalar(scale);
    instance.updateMatrixWorld(true);

    const heightScaledBox = new THREE.Box3().setFromObject(instance);
    const heightScaledSize = heightScaledBox.getSize(new THREE.Vector3());
    instance.scale.x *= width / Math.max(heightScaledSize.x, 0.001);
    instance.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3().setFromObject(instance);
    const center = scaledBox.getCenter(new THREE.Vector3());
    instance.position.set(-center.x, -scaledBox.min.y, -center.z);

    return instance;
  }

  createSign(text, position, rotationY = 0, width = 3.1) {
    const group = new THREE.Group();
    const sign = this.mesh(new THREE.BoxGeometry(width, 0.7, 0.12), this.materials.sign, [0, 0, 0], true, false);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    context.fillStyle = "#10182a";
    context.fillRect(0, 0, 512, 128);
    context.strokeStyle = "#e9c477";
    context.lineWidth = 8;
    context.strokeRect(10, 10, 492, 108);
    context.fillStyle = "#ffe3a6";
    context.font = "bold 40px serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 256, 67);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const label = this.mesh(new THREE.PlaneGeometry(width * 0.92, 0.52), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }), [0, 0, 0.065], false, false);
    group.add(sign, label);
    group.position.set(...position);
    group.rotation.y = rotationY;
    return group;
  }

  createBench(position, rotationY = 0) {
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.y = rotationY;

    this.loadBenchModel()
      .then(model => {
        group.add(this.createBenchModelInstance(model, 3.4));
      })
      .catch(error => {
        console.error("Impossibile caricare il modello della panchina:", error);
      });

    return group;
  }

  loadBenchModel() {
    if (!this.benchModelPromise) {
      const loader = new GLTFLoader();
      this.benchModelPromise = loader.loadAsync(BENCH_MODEL_URL).then(gltf => {
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

    return this.benchModelPromise;
  }

  createBenchModelInstance(model, length) {
    const instance = model.clone(true);
    const box = new THREE.Box3().setFromObject(instance);
    const size = box.getSize(new THREE.Vector3());
    const horizontalLength = Math.max(size.x, size.z, 0.001);
    const scale = length / horizontalLength;

    instance.scale.setScalar(scale);
    instance.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3().setFromObject(instance);
    const center = scaledBox.getCenter(new THREE.Vector3());
    instance.position.set(-center.x, -scaledBox.min.y, -center.z);

    return instance;
  }
}
