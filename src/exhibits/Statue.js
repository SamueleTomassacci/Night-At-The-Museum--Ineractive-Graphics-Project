import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MOAI_MODEL_URL = "/models/moai%20statue/animal_crossing_new_horizons_moai_statue.glb";
const MOAI_TARGET_HEIGHT = 2.85;
const MOAI_LOCAL_FACE_ANGLE = -THREE.MathUtils.degToRad(40);
const MOAI_FACE_ENTRANCE_ROTATION = -Math.PI / 2 - MOAI_LOCAL_FACE_ANGLE;
const PEDESTAL_HEIGHT = 0.55;
const MOUTH_INTERIOR_DARKNESS = 0.08;
const TALK_PHRASE = [
  { open: 0.52, openMs: 260, closeMs: 220, pauseMs: 90 },
  { open: 0.28, openMs: 180, closeMs: 170, pauseMs: 55 },
  { open: 0.82, openMs: 310, closeMs: 260, pauseMs: 130 },
  { open: 0.44, openMs: 220, closeMs: 210, pauseMs: 80 },
  { open: 0.68, openMs: 280, closeMs: 240, pauseMs: 260 }
];

export class Statue {
  constructor(materials) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.position.set(16.5, 0, 0);
    this.pedestal = this.createPedestal();
    this.modelRoot = new THREE.Group();
    this.modelRoot.position.y = PEDESTAL_HEIGHT;
    this.modelRoot.rotation.y = MOAI_FACE_ENTRANCE_ROTATION;
    this.group.add(this.pedestal, this.modelRoot);
    this.model = null;
    this.mouthState = { open: 0 };
    this.mouthDeformations = [];
    this.mouthTween = null;
    this.talkIndex = 0;
    this.awake = false;
    this.faceSpotlights = this.createFaceSpotlights();
    this.group.add(this.faceSpotlights);
    this.createModel();
  }

  createPedestal() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.25, 0.18, 36),
      this.materials.trim
    );
    base.position.y = 0.09;

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.05, PEDESTAL_HEIGHT - 0.18, 36),
      this.materials.statue
    );
    plinth.position.y = 0.18 + (PEDESTAL_HEIGHT - 0.18) / 2;

    group.add(base, plinth);
    group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return group;
  }

  createFaceSpotlights() {
    const group = new THREE.Group();
    group.name = "Statue Face Spotlights";

    const target = new THREE.Object3D();
    target.name = "Statue Face Spotlight Target";
    target.position.set(0, PEDESTAL_HEIGHT + 1.75, 0);
    group.add(target);

    [
      { name: "Left Statue Face Spotlight", position: [-4.25, 3.15, -1.15] },
      { name: "Right Statue Face Spotlight", position: [-4.25, 3.15, 1.15] }
    ].forEach(config => {
      const light = new THREE.SpotLight(0xffedd0, 3.4, 8.5, Math.PI / 10, 0.4, 1.25);
      light.name = config.name;
      light.position.set(...config.position);
      light.target = target;
      light.castShadow = false;
      group.add(light);
    });

    return group;
  }

  createModel() {
    const loader = new GLTFLoader();
    loader.load(
      MOAI_MODEL_URL,
      gltf => {
        const model = gltf.scene;

        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        model.updateMatrixWorld(true);
        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const scale = MOAI_TARGET_HEIGHT / Math.max(initialSize.y, 0.001);
        model.scale.setScalar(scale);

        model.updateMatrixWorld(true);
        const groundAnchor = this.getGroundAnchor(model);
        model.position.set(-groundAnchor.x, -groundAnchor.y, -groundAnchor.z);

        this.model = model;
        this.modelRoot.add(model);
        this.setupMouthDeformation(model);
        this.startMouthAnimation();
      },
      undefined,
      error => {
        console.error("Impossibile caricare il modello Moai:", error);
      }
    );
  }

  setupMouthDeformation(model) {
    this.modelRoot.updateMatrixWorld(true);
    model.updateMatrixWorld(true);

    const bounds = this.getModelRootBounds(model);
    const sizeY = bounds.maxY - bounds.minY;
    const depth = bounds.maxForward - bounds.minForward;
    const mouthY = bounds.minY + sizeY * 0.47;
    const mouthRadiusY = sizeY * 0.07;
    const frontDepth = depth * 0.24;
    const frontStart = bounds.maxForward - frontDepth;
    const forward = this.getLocalFaceDirection();
    const lateral = new THREE.Vector2(forward.y, -forward.x);
    const mouthBand = this.getMouthBand(model, mouthY, mouthRadiusY, frontStart, forward, lateral);
    const mouthLateral = mouthBand.center;
    const mouthRadiusX = Math.max(
      mouthBand.width * 0.58,
      (bounds.maxLateral - bounds.minLateral) * 0.26
    );
    const localVertex = new THREE.Vector3();
    const rootVertex = new THREE.Vector3();
    const targetRootVertex = new THREE.Vector3();
    const targetLocalVertex = new THREE.Vector3();

    model.traverse(child => {
      if (!child.isMesh || !child.geometry?.attributes?.position) {
        return;
      }

      child.geometry = child.geometry.clone();
      const position = child.geometry.attributes.position;
      position.setUsage(THREE.DynamicDrawUsage);
      const color = this.createVertexColorAttribute(child.geometry);
      const original = position.array.slice();
      const originalColor = color.array.slice();
      const targets = [];
      this.enableVertexColors(child);

      for (let i = 0; i < position.count; i += 1) {
        localVertex.fromBufferAttribute(position, i);
        rootVertex.copy(localVertex);
        child.localToWorld(rootVertex);
        this.modelRoot.worldToLocal(rootVertex);

        const forwardCoord = rootVertex.x * forward.x + rootVertex.z * forward.y;
        const lateralCoord = rootVertex.x * lateral.x + rootVertex.z * lateral.y;
        const frontWeight = THREE.MathUtils.clamp((forwardCoord - frontStart) / frontDepth, 0, 1);
        if (frontWeight <= 0) {
          continue;
        }

        const dx = (lateralCoord - mouthLateral) / mouthRadiusX;
        const dy = (rootVertex.y - mouthY) / mouthRadiusY;
        const lateralAmount = Math.abs(dx);
        const verticalWeight = Math.max(0, 1 - dy * dy);
        const lateralWeight = Math.max(0, 1 - Math.pow(lateralAmount, 2.6));
        const mouthWeight = verticalWeight * lateralWeight;
        if (mouthWeight <= 0) {
          continue;
        }

        const centerWeight = Math.max(0, 1 - lateralAmount * 0.65);
        const weight = THREE.MathUtils.lerp(0.72, 1, frontWeight) * mouthWeight * centerWeight;
        const lowerLip = dy < 0;
        const lift = sizeY * (lowerLip ? -0.07 : 0.022) * weight;
        const surfacePush = depth * 0.004 * weight;
        const darknessWeight = Math.max(0, 1 - Math.abs(dy) * 1.25) * Math.max(0, 1 - lateralAmount * 1.2) * frontWeight;
        targetRootVertex.copy(rootVertex);
        targetRootVertex.y += lift;
        targetRootVertex.x += forward.x * surfacePush;
        targetRootVertex.z += forward.y * surfacePush;

        targetLocalVertex.copy(targetRootVertex);
        this.modelRoot.localToWorld(targetLocalVertex);
        child.worldToLocal(targetLocalVertex);

        targets.push({
          index: i,
          x: targetLocalVertex.x - localVertex.x,
          y: targetLocalVertex.y - localVertex.y,
          z: targetLocalVertex.z - localVertex.z,
          darkness: darknessWeight
        });
      }

      if (targets.length > 0) {
        this.mouthDeformations.push({
          geometry: child.geometry,
          position,
          color,
          original,
          originalColor,
          targets
        });
      }
    });

    if (this.mouthDeformations.length === 0) {
      console.warn("Nessun vertice trovato per la deformazione della bocca del Moai.");
    }
  }

  createVertexColorAttribute(geometry) {
    const position = geometry.attributes.position;
    const existingColor = geometry.attributes.color;
    const colors = existingColor
      ? new Float32Array(existingColor.array)
      : new Float32Array(position.count * 3);

    if (!existingColor) {
      colors.fill(1);
    }

    const attribute = new THREE.BufferAttribute(colors, 3);
    attribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("color", attribute);
    return attribute;
  }

  enableVertexColors(mesh) {
    const enable = material => {
      const clone = material.clone();
      clone.vertexColors = true;
      clone.needsUpdate = true;
      return clone;
    };

    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(material => enable(material))
      : enable(mesh.material);
  }

  getMouthBand(model, mouthY, mouthRadiusY, frontStart, forward, lateral) {
    const vertex = new THREE.Vector3();
    let minLateral = Infinity;
    let maxLateral = -Infinity;
    let sumLateral = 0;
    let count = 0;

    model.traverse(child => {
      const position = child.isMesh ? child.geometry?.attributes?.position : null;
      if (!position) {
        return;
      }

      for (let i = 0; i < position.count; i += 1) {
        vertex.fromBufferAttribute(position, i);
        child.localToWorld(vertex);
        this.modelRoot.worldToLocal(vertex);

        const forwardCoord = vertex.x * forward.x + vertex.z * forward.y;
        if (forwardCoord < frontStart) {
          continue;
        }

        const verticalDistance = Math.abs(vertex.y - mouthY);
        if (verticalDistance > mouthRadiusY * 1.15) {
          continue;
        }

        const lateralCoord = vertex.x * lateral.x + vertex.z * lateral.y;
        minLateral = Math.min(minLateral, lateralCoord);
        maxLateral = Math.max(maxLateral, lateralCoord);
        sumLateral += lateralCoord;
        count += 1;
      }
    });

    if (count === 0) {
      return { center: 0, width: 1 };
    }

    const average = sumLateral / count;
    const middle = (minLateral + maxLateral) / 2;
    return {
      center: (average + middle) / 2,
      width: maxLateral - minLateral
    };
  }

  getLocalFaceDirection() {
    return new THREE.Vector2(
      Math.sin(MOAI_LOCAL_FACE_ANGLE),
      Math.cos(MOAI_LOCAL_FACE_ANGLE)
    ).normalize();
  }

  getModelRootBounds(model) {
    const forward = this.getLocalFaceDirection();
    const lateral = new THREE.Vector2(forward.y, -forward.x);
    const vertex = new THREE.Vector3();
    const bounds = {
      minY: Infinity,
      maxY: -Infinity,
      minForward: Infinity,
      maxForward: -Infinity,
      minLateral: Infinity,
      maxLateral: -Infinity
    };

    model.traverse(child => {
      const position = child.isMesh ? child.geometry?.attributes?.position : null;
      if (!position) {
        return;
      }

      for (let i = 0; i < position.count; i += 1) {
        vertex.fromBufferAttribute(position, i);
        child.localToWorld(vertex);
        this.modelRoot.worldToLocal(vertex);

        const forwardCoord = vertex.x * forward.x + vertex.z * forward.y;
        const lateralCoord = vertex.x * lateral.x + vertex.z * lateral.y;

        bounds.minY = Math.min(bounds.minY, vertex.y);
        bounds.maxY = Math.max(bounds.maxY, vertex.y);
        bounds.minForward = Math.min(bounds.minForward, forwardCoord);
        bounds.maxForward = Math.max(bounds.maxForward, forwardCoord);
        bounds.minLateral = Math.min(bounds.minLateral, lateralCoord);
        bounds.maxLateral = Math.max(bounds.maxLateral, lateralCoord);
      }
    });

    return bounds;
  }

  startMouthAnimation() {
    if (this.mouthDeformations.length === 0) {
      return;
    }

    this.playNextMouthSyllable();
  }

  playNextMouthSyllable() {
    const syllable = TALK_PHRASE[this.talkIndex];
    this.talkIndex = (this.talkIndex + 1) % TALK_PHRASE.length;

    const openTween = new TWEEN.Tween(this.mouthState)
      .to({ open: syllable.open }, syllable.openMs)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .onUpdate(() => this.applyMouthDeformation());

    const closeTween = new TWEEN.Tween(this.mouthState)
      .to({ open: 0 }, syllable.closeMs)
      .delay(syllable.pauseMs)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .onUpdate(() => this.applyMouthDeformation())
      .onComplete(() => this.playNextMouthSyllable());

    openTween.chain(closeTween);
    this.mouthTween = openTween;
    TWEEN.add(openTween, closeTween);
    openTween.start();
  }

  applyMouthDeformation() {
    this.mouthDeformations.forEach(deformation => {
      const array = deformation.position.array;
      deformation.targets.forEach(target => {
        const offset = target.index * 3;
        array[offset] = deformation.original[offset] + target.x * this.mouthState.open;
        array[offset + 1] = deformation.original[offset + 1] + target.y * this.mouthState.open;
        array[offset + 2] = deformation.original[offset + 2] + target.z * this.mouthState.open;

        const darken = this.mouthState.open * target.darkness;
        const colorFactor = THREE.MathUtils.lerp(1, MOUTH_INTERIOR_DARKNESS, darken);
        deformation.color.array[offset] = deformation.originalColor[offset] * colorFactor;
        deformation.color.array[offset + 1] = deformation.originalColor[offset + 1] * colorFactor;
        deformation.color.array[offset + 2] = deformation.originalColor[offset + 2] * colorFactor;
      });
      deformation.position.needsUpdate = true;
      deformation.color.needsUpdate = true;
      deformation.geometry.computeVertexNormals();
    });
  }

  getGroundAnchor(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const cutoffY = box.min.y + size.y * 0.22;
    const vertex = new THREE.Vector3();
    const groundBox = new THREE.Box3();
    let hasGroundVertices = false;

    model.traverse(child => {
      const position = child.isMesh ? child.geometry?.attributes?.position : null;
      if (!position) {
        return;
      }

      for (let i = 0; i < position.count; i += 1) {
        vertex.fromBufferAttribute(position, i);
        child.localToWorld(vertex);
        if (vertex.y <= cutoffY) {
          groundBox.expandByPoint(vertex);
          hasGroundVertices = true;
        }
      }
    });

    const center = hasGroundVertices
      ? groundBox.getCenter(new THREE.Vector3())
      : box.getCenter(new THREE.Vector3());

    return new THREE.Vector3(center.x, box.min.y, center.z);
  }

  awaken() {
    this.awake = true;
    this.modelRoot.rotation.y = MOAI_FACE_ENTRANCE_ROTATION;
  }

  update() {
    this.modelRoot.position.y = PEDESTAL_HEIGHT;
    this.modelRoot.scale.setScalar(1);
    this.modelRoot.rotation.y = MOAI_FACE_ENTRANCE_ROTATION;
  }
}
