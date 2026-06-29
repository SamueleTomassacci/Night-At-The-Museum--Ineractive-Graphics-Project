import * as THREE from "three";
import { createPaintingTexture } from "../utils/proceduralTextures.js";
import { distance2D } from "../utils/math.js";

class Painting {
  constructor(materials, index, position, rotationY) {
    this.materials = materials;
    this.index = index;
    this.group = new THREE.Group();
    this.group.position.set(...position);
    this.group.rotation.y = rotationY;
    this.seed = index + 1;
    this.reactive = false;
    this.createModel();
  }

  createModel() {
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.18, 0.18), this.materials.wood);
    const bottomFrame = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.18, 0.18), this.materials.wood);
    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.65, 0.18), this.materials.wood);
    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.65, 0.18), this.materials.wood);
    topFrame.position.y = 0.735;
    bottomFrame.position.y = -0.735;
    leftFrame.position.x = -1.035;
    rightFrame.position.x = 1.035;
    const artMaterial = new THREE.MeshStandardMaterial({ map: createPaintingTexture(this.seed), roughness: 0.34, metalness: 0.04, emissive: 0x000000, side: THREE.DoubleSide });
    this.surface = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.22), artMaterial);
    this.surface.position.z = -0.12;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.3), this.materials.glass);
    glass.position.z = -0.17;
    this.group.add(topFrame, bottomFrame, leftFrame, rightFrame, this.surface, glass);
    this.group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  onClick() {
    this.seed += 7;
    this.surface.material.map = createPaintingTexture(this.seed);
    this.surface.material.needsUpdate = true;
  }

  react(strength) {
    this.reactive = strength > 0;
    this.surface.material.emissive.setHex(this.reactive ? 0x222244 : 0x000000);
    this.surface.material.emissiveIntensity = strength * 0.9;
  }

  update(deltaTime, elapsedTime) {
    const target = this.reactive ? Math.sin(elapsedTime * 5 + this.index) * 0.08 : 0;
    this.group.rotation.z += (target - this.group.rotation.z) * Math.min(1, deltaTime * 7);
  }
}

export class Paintings {
  constructor(materials) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.paintings = [
      new Painting(materials, 0, [-5.4, 2.3, 21.7], 0),
      new Painting(materials, 1, [-1.8, 2.3, 21.7], 0),
      new Painting(materials, 2, [1.8, 2.3, 21.7], 0),
      new Painting(materials, 3, [5.4, 2.3, 21.7], 0)
    ];
    this.paintings.forEach(painting => this.group.add(painting.group));
  }

  getClickables() {
    return this.paintings;
  }

  updateReactions(playerPosition) {
    let nearest = null;
    let nearestDistance = Infinity;
    this.paintings.forEach(painting => {
      const world = new THREE.Vector3();
      painting.group.getWorldPosition(world);
      const dist = distance2D(playerPosition, world);
      if (dist < nearestDistance) {
        nearest = painting;
        nearestDistance = dist;
      }
    });
    this.paintings.forEach(painting => painting.react(painting === nearest && nearestDistance < 5 ? 1 - nearestDistance / 5 : 0));
  }

  update(deltaTime, elapsedTime) {
    this.paintings.forEach(painting => painting.update(deltaTime, elapsedTime));
  }
}
