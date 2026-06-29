import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { angleTo } from "../utils/math.js";

export class Dinosaur {
  constructor(materials) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.position.set(-16.5, 0.05, 0);
    this.group.rotation.y = Math.PI * 0.5;
    this.awake = false;
    this.awakenedOnce = false;
    this.createModel();
  }

  createModel() {
    this.body = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 2.9, 8, 16), this.materials.bone);
    this.body.rotation.z = Math.PI * 0.5;
    this.body.position.y = 2.1;
    this.neckGroup = new THREE.Group();
    this.neckGroup.position.set(1.45, 2.45, 0);
    const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.15, 6, 10), this.materials.bone);
    neck.rotation.z = -0.62;
    neck.position.set(0.42, 0.38, 0);
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0.95, 0.82, 0);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.48, 0.48), this.materials.bone);
    skull.position.x = 0.3;
    this.jaw = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.42), this.materials.darkBone);
    this.jaw.position.set(0.38, -0.32, 0);
    this.jaw.geometry.translate(0.15, 0, 0);
    this.headGroup.add(skull, this.jaw);
    this.neckGroup.add(neck, this.headGroup);
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(-1.55, 2.08, 0);
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 2.4, 6, 10), this.materials.bone);
    tail.rotation.z = Math.PI * 0.5;
    tail.position.x = -1.05;
    this.tailGroup.add(tail);
    this.leftLegGroup = this.createLeg(-0.55);
    this.rightLegGroup = this.createLeg(0.55);
    this.leftArmGroup = this.createArm(-0.5);
    this.rightArmGroup = this.createArm(0.5);
    this.group.add(this.body, this.neckGroup, this.tailGroup, this.leftLegGroup, this.rightLegGroup, this.leftArmGroup, this.rightArmGroup);
    this.addSpines();
    this.group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  createLeg(side) {
    const group = new THREE.Group();
    group.position.set(-0.2, 1.45, side);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.1, 6, 10), this.materials.bone);
    upper.rotation.z = 0.22;
    upper.position.y = -0.55;
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.9, 6, 10), this.materials.bone);
    lower.position.set(0.18, -1.35, 0);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.28), this.materials.darkBone);
    foot.position.set(0.45, -1.86, 0);
    group.add(upper, lower, foot);
    return group;
  }

  createArm(side) {
    const group = new THREE.Group();
    group.position.set(0.9, 2.15, side);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.7, 5, 8), this.materials.bone);
    arm.rotation.z = -0.5;
    arm.position.set(0.26, -0.34, 0);
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 8), this.materials.darkBone);
    claw.rotation.z = -Math.PI * 0.5;
    claw.position.set(0.55, -0.63, 0);
    group.add(arm, claw);
    return group;
  }

  addSpines() {
    for (let i = 0; i < 8; i += 1) {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 8), this.materials.darkBone);
      spine.position.set(-1.05 + i * 0.33, 2.65 + Math.sin(i) * 0.08, 0);
      spine.rotation.x = Math.PI;
      this.group.add(spine);
    }
  }

  awaken(playerPosition) {
    if (this.awakenedOnce) {
      this.awake = true;
      return;
    }
    this.awake = true;
    this.awakenedOnce = true;
    new TWEEN.Tween(this.neckGroup.rotation).to({ z: -0.55, y: 0.18 }, 1100).easing(TWEEN.Easing.Cubic.Out).start();
    new TWEEN.Tween(this.headGroup.rotation).to({ z: 0.34 }, 900).easing(TWEEN.Easing.Back.Out).start();
    new TWEEN.Tween(this.jaw.rotation).to({ z: 0.58 }, 650).easing(TWEEN.Easing.Back.Out).yoyo(true).repeat(1).start();
    new TWEEN.Tween(this.tailGroup.rotation).to({ y: 0.72 }, 700).easing(TWEEN.Easing.Quadratic.InOut).yoyo(true).repeat(3).start();
    if (playerPosition) {
      const world = new THREE.Vector3();
      this.group.getWorldPosition(world);
      this.group.rotation.y = angleTo(world, playerPosition) - Math.PI * 0.5;
    }
  }

  update(deltaTime, elapsedTime) {
    const idleScale = this.awake ? 1.8 : 0.7;
    this.tailGroup.rotation.y += Math.sin(elapsedTime * 2.4) * deltaTime * 0.48 * idleScale;
    this.headGroup.rotation.y = Math.sin(elapsedTime * 1.2) * 0.08 * idleScale;
    this.neckGroup.rotation.x = Math.sin(elapsedTime * 0.9) * 0.04;
    this.leftLegGroup.rotation.z = Math.sin(elapsedTime * 1.3) * 0.03;
    this.rightLegGroup.rotation.z = -Math.sin(elapsedTime * 1.3) * 0.03;
  }
}
