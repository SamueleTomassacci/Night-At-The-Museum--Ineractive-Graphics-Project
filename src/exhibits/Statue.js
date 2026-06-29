import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { angleTo } from "../utils/math.js";

export class Statue {
  constructor(materials) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.position.set(16.5, 0, 0);
    this.awake = false;
    this.busy = false;
    this.createModel();
  }

  createModel() {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.55, 2.5), this.materials.trim);
    base.position.y = 0.28;
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 1.2, 24), this.materials.statue);
    pedestal.position.y = 1.15;
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 1.4, 8, 16), this.materials.statue);
    torso.position.y = 2.35;
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 3.35;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), this.materials.statue);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.4, 0.18, 16), this.materials.gold);
    crown.position.y = 0.42;
    this.headGroup.add(head, crown);
    this.leftArm = this.createArm(-0.65);
    this.rightArm = this.createArm(0.65);
    this.group.add(base, pedestal, torso, this.headGroup, this.leftArm, this.rightArm);
    this.group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  createArm(side) {
    const group = new THREE.Group();
    group.position.set(side, 2.85, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 1.1, 6, 10), this.materials.statue);
    arm.position.y = -0.5;
    group.rotation.z = side < 0 ? 0.46 : -0.46;
    group.add(arm);
    return group;
  }

  awaken(playerPosition) {
    this.awake = true;
    const world = new THREE.Vector3();
    this.group.getWorldPosition(world);
    const look = angleTo(world, playerPosition);
    this.headGroup.rotation.y = look - this.group.rotation.y;
    if (this.busy) {
      return;
    }
    this.busy = true;
    new TWEEN.Tween(this.rightArm.rotation)
      .to({ z: -1.65, x: -0.25 }, 1300)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .yoyo(true)
      .repeat(1)
      .onComplete(() => {
        this.busy = false;
      })
      .start();
  }

  update(deltaTime, elapsedTime) {
    if (!this.awake) {
      this.headGroup.rotation.y = Math.sin(elapsedTime * 0.45) * 0.05;
    }
    this.group.rotation.y = Math.sin(elapsedTime * 0.18) * 0.02;
  }
}
