import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const COLUMN_MODEL_URL = "/models/Column/ionic_column.glb";
const BENCH_MODEL_URL = "/models/bench/modern_bench_1.glb";
const CEILING_HEIGHT = 5.0;
const CORNICE_HEIGHT = 0.28;
const CORNICE_PROJECTION = 0.22;
const CORNICE_ACCENT_HEIGHT = 0.055;
const DOOR_HEIGHT = 3.4;
const DOOR_DEPTH = 0.16;
const DOOR_FRAME_THICKNESS = 0.14;
const DOOR_PANEL_OVERLAP = 0.025;
const DOOR_RAIL_THICKNESS = 0.1;
const DOOR_STILE_THICKNESS = 0.09;

export class AssetFactory {
  constructor(materials) {
    this.materials = materials;
    this.columnModelPromise = null;
    this.benchModelPromise = null;
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

  createCeiling(width, depth, position, height = CEILING_HEIGHT) {
    const mesh = this.mesh(new THREE.PlaneGeometry(width, depth), this.materials.ceiling, [position[0], height, position[2]], false, true);
    mesh.rotation.x = Math.PI * 0.5;
    return mesh;
  }

  createCornice(width, depth, position, height = CEILING_HEIGHT) {
    const group = new THREE.Group();
    group.name = "Ceiling Cornice";

    const y = height - CORNICE_HEIGHT / 2;
    const accentY = height - CORNICE_HEIGHT + CORNICE_ACCENT_HEIGHT / 2;
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    const addBand = (geometry, bandPosition) => {
      const band = this.mesh(geometry, this.materials.wood, bandPosition, true, true);
      group.add(band);
    };

    const addAccent = (geometry, accentPosition) => {
      const accent = this.mesh(geometry, this.materials.gold, accentPosition, true, true);
      group.add(accent);
    };

    addBand(new THREE.BoxGeometry(width, CORNICE_HEIGHT, CORNICE_PROJECTION), [position[0], y, position[2] - halfDepth + CORNICE_PROJECTION / 2]);
    addBand(new THREE.BoxGeometry(width, CORNICE_HEIGHT, CORNICE_PROJECTION), [position[0], y, position[2] + halfDepth - CORNICE_PROJECTION / 2]);
    addBand(new THREE.BoxGeometry(CORNICE_PROJECTION, CORNICE_HEIGHT, depth), [position[0] - halfWidth + CORNICE_PROJECTION / 2, y, position[2]]);
    addBand(new THREE.BoxGeometry(CORNICE_PROJECTION, CORNICE_HEIGHT, depth), [position[0] + halfWidth - CORNICE_PROJECTION / 2, y, position[2]]);

    addAccent(new THREE.BoxGeometry(width, CORNICE_ACCENT_HEIGHT, CORNICE_PROJECTION * 1.08), [position[0], accentY, position[2] - halfDepth + CORNICE_PROJECTION / 2]);
    addAccent(new THREE.BoxGeometry(width, CORNICE_ACCENT_HEIGHT, CORNICE_PROJECTION * 1.08), [position[0], accentY, position[2] + halfDepth - CORNICE_PROJECTION / 2]);
    addAccent(new THREE.BoxGeometry(CORNICE_PROJECTION * 1.08, CORNICE_ACCENT_HEIGHT, depth), [position[0] - halfWidth + CORNICE_PROJECTION / 2, accentY, position[2]]);
    addAccent(new THREE.BoxGeometry(CORNICE_PROJECTION * 1.08, CORNICE_ACCENT_HEIGHT, depth), [position[0] + halfWidth - CORNICE_PROJECTION / 2, accentY, position[2]]);

    return group;
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
    group.userData.slidingPanels = [];
    group.userData.isOpen = false;
    group.userData.isAnimating = false;
    group.userData.ready = true;
    group.userData.closedPositions = [];
    group.userData.openPositions = [];
    group.userData.autoCloseTimeout = null;

    const doorVisual = this.createProceduralSlidingDoor(width);
    const slidingPanels = [doorVisual.userData.leftPanel, doorVisual.userData.rightPanel];

    group.add(doorVisual);
    group.userData.doorVisual = doorVisual;
    group.userData.slidingPanels = slidingPanels;
    group.userData.closedPositions = slidingPanels.map(panel => panel.position.clone());
    group.userData.openPositions = slidingPanels.map(panel => {
      const direction = panel.userData.slideDirection ?? 1;
      return panel.position.clone().add(new THREE.Vector3(direction * width * 0.5, 0, 0));
    });

    return group;
  }

  createProceduralSlidingDoor(width) {
    const group = new THREE.Group();
    group.name = "ProceduralSlidingDoor";

    const metalMaterial = this.createDoorMetalMaterial();
    const glassMaterial = this.createDoorGlassMaterial();
    const railMaterial = this.createDoorRailMaterial();

    const jambHeight = DOOR_HEIGHT;
    const headerY = DOOR_HEIGHT - DOOR_FRAME_THICKNESS / 2;
    const panelHeight = DOOR_HEIGHT - DOOR_FRAME_THICKNESS * 2;
    const panelWidth = width / 2 + DOOR_PANEL_OVERLAP;
    const panelY = DOOR_FRAME_THICKNESS + panelHeight / 2;

    const leftJamb = this.mesh(new THREE.BoxGeometry(DOOR_FRAME_THICKNESS, jambHeight, DOOR_DEPTH), metalMaterial, [-width / 2, jambHeight / 2, 0]);
    const rightJamb = this.mesh(new THREE.BoxGeometry(DOOR_FRAME_THICKNESS, jambHeight, DOOR_DEPTH), metalMaterial, [width / 2, jambHeight / 2, 0]);
    const header = this.mesh(new THREE.BoxGeometry(width + DOOR_FRAME_THICKNESS, DOOR_FRAME_THICKNESS, DOOR_DEPTH), metalMaterial, [0, headerY, 0]);
    const threshold = this.mesh(new THREE.BoxGeometry(width + DOOR_FRAME_THICKNESS, DOOR_FRAME_THICKNESS * 0.6, DOOR_DEPTH), metalMaterial, [0, DOOR_FRAME_THICKNESS * 0.3, 0]);
    const track = this.mesh(new THREE.BoxGeometry(width * 0.96, 0.04, DOOR_DEPTH * 1.22), railMaterial, [0, DOOR_HEIGHT - DOOR_FRAME_THICKNESS - 0.03, 0.01], true, true);

    const leftPanel = this.createDoorPanel(panelWidth, panelHeight, metalMaterial, glassMaterial);
    const rightPanel = this.createDoorPanel(panelWidth, panelHeight, metalMaterial, glassMaterial);
    leftPanel.name = "LeftSlidingDoorPanel";
    rightPanel.name = "RightSlidingDoorPanel";
    leftPanel.position.set(-panelWidth / 2 + DOOR_PANEL_OVERLAP / 2, panelY, 0);
    rightPanel.position.set(panelWidth / 2 - DOOR_PANEL_OVERLAP / 2, panelY, 0);
    leftPanel.userData.slideDirection = -1;
    rightPanel.userData.slideDirection = 1;

    group.add(leftJamb, rightJamb, header, threshold, track, leftPanel, rightPanel);
    group.userData.leftPanel = leftPanel;
    group.userData.rightPanel = rightPanel;
    return group;
  }

  createDoorPanel(width, height, metalMaterial, glassMaterial) {
    const panel = new THREE.Group();
    const glassWidth = width - DOOR_STILE_THICKNESS * 2;
    const glassHeight = height - DOOR_RAIL_THICKNESS * 2;

    const glass = this.mesh(new THREE.PlaneGeometry(glassWidth, glassHeight), glassMaterial, [0, 0, DOOR_DEPTH * 0.52], false, false);
    const leftStile = this.mesh(new THREE.BoxGeometry(DOOR_STILE_THICKNESS, height, DOOR_DEPTH), metalMaterial, [-width / 2 + DOOR_STILE_THICKNESS / 2, 0, 0]);
    const rightStile = this.mesh(new THREE.BoxGeometry(DOOR_STILE_THICKNESS, height, DOOR_DEPTH), metalMaterial, [width / 2 - DOOR_STILE_THICKNESS / 2, 0, 0]);
    const topRail = this.mesh(new THREE.BoxGeometry(width, DOOR_RAIL_THICKNESS, DOOR_DEPTH), metalMaterial, [0, height / 2 - DOOR_RAIL_THICKNESS / 2, 0]);
    const bottomRail = this.mesh(new THREE.BoxGeometry(width, DOOR_RAIL_THICKNESS, DOOR_DEPTH), metalMaterial, [0, -height / 2 + DOOR_RAIL_THICKNESS / 2, 0]);

    panel.add(glass, leftStile, rightStile, topRail, bottomRail);
    return panel;
  }

  createDoorMetalMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0x05070d,
      roughness: 0.42,
      metalness: 0.38
    });
  }

  createDoorRailMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0x141923,
      roughness: 0.55,
      metalness: 0.45
    });
  }

  createDoorGlassMaterial() {
    return new THREE.MeshPhysicalMaterial({
      color: 0x9fc7ff,
      roughness: 0.08,
      metalness: 0,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide
    });
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
