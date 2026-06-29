import * as THREE from "three";
import { damp } from "../utils/math.js";

export class Player {
  constructor(materials, inputManager, collisionSystem) {
    this.materials = materials;
    this.inputManager = inputManager;
    this.collisionSystem = collisionSystem;
    this.speed = 5.4;
    this.walkTime = 0;
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 3.8);
    this.createModel();
  }

  createModel() {
    this.body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.72, 6, 12), this.materials.playerCoat);
    this.body.position.y = 1.18;
    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 20, 14), this.materials.playerSkin);
    this.head.position.y = 1.88;
    this.hat = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.18, 18), this.materials.trim);
    this.hat.position.y = 2.14;
    this.leftArm = this.createLimb(0.11, 0.58, this.materials.playerCoat);
    this.rightArm = this.createLimb(0.11, 0.58, this.materials.playerCoat);
    this.leftLeg = this.createLimb(0.13, 0.7, this.materials.trim);
    this.rightLeg = this.createLimb(0.13, 0.7, this.materials.trim);
    this.leftArm.position.set(-0.48, 1.28, 0);
    this.rightArm.position.set(0.48, 1.28, 0);
    this.leftLeg.position.set(-0.2, 0.52, 0);
    this.rightLeg.position.set(0.2, 0.52, 0);
    this.leftArm.rotation.z = 0.2;
    this.rightArm.rotation.z = -0.2;
    this.group.add(this.body, this.head, this.hat, this.leftArm, this.rightArm, this.leftLeg, this.rightLeg);
    this.group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  createLimb(radius, height, material) {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, height, 5, 10), material);
    mesh.position.y = -height * 0.5;
    group.add(mesh);
    return group;
  }

  update(deltaTime) {
    const input = this.inputManager.getMovementVector();
    const moving = input.lengthSq() > 0;
    if (moving) {
      this.group.position.addScaledVector(input, this.speed * deltaTime);
      const targetRotation = Math.atan2(input.x, input.z);
      this.group.rotation.y = damp(this.group.rotation.y, targetRotation, 14, deltaTime);
      this.walkTime += deltaTime * 9.5;
    } else {
      this.walkTime += deltaTime * 3;
    }

    this.collisionSystem.constrain(this.group.position, 0.48);

    const swing = moving ? Math.sin(this.walkTime) * 0.56 : Math.sin(this.walkTime) * 0.04;
    this.leftArm.rotation.x = swing;
    this.rightArm.rotation.x = -swing;
    this.leftLeg.rotation.x = -swing;
    this.rightLeg.rotation.x = swing;
    this.body.position.y = 1.18 + (moving ? Math.abs(Math.sin(this.walkTime * 2)) * 0.035 : 0);
    this.head.rotation.y = Math.sin(this.walkTime * 0.35) * 0.06;
  }
}
