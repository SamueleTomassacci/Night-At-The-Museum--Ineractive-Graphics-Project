import * as THREE from "three";

export class Player {
  constructor(materials, inputManager, collisionSystem) {
    this.materials = materials;
    this.inputManager = inputManager;
    this.collisionSystem = collisionSystem;
    this.speed = 5.4;
    this.turnSpeed = 2.8;
    this.walkTime = 0;
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 3.8);
    this.createModel();
    this.createFlashlight();
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
    this.modelParts = [this.body, this.head, this.hat, this.leftArm, this.rightArm, this.leftLeg, this.rightLeg];
    this.group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  createFlashlight() {
    this.flashlightGroup = new THREE.Group();
    this.flashlightGroup.name = "Player Flashlight";
    this.flashlightGroup.position.set(0.36, 1.18, 0.28);
    this.flashlightGroup.rotation.x = -0.08;

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x151923,
      roughness: 0.35,
      metalness: 0.55
    });
    this.flashlightLensMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe0a4,
      roughness: 0.2,
      metalness: 0,
      emissive: 0xffc36d,
      emissiveIntensity: 0
    });

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.42, 16), bodyMaterial);
    handle.rotation.x = Math.PI * 0.5;
    handle.castShadow = true;
    handle.receiveShadow = true;

    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.075, 0.16, 20), bodyMaterial);
    head.rotation.x = Math.PI * 0.5;
    head.position.z = 0.24;
    head.castShadow = true;
    head.receiveShadow = true;

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.083, 20), this.flashlightLensMaterial);
    lens.position.z = 0.325;
    lens.rotation.y = Math.PI;

    this.flashlight = new THREE.SpotLight(0xffe2b2, 0, 13, Math.PI / 8, 0.55, 1.25);
    this.flashlight.position.set(0, 0, 0.34);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.set(1024, 1024);
    this.flashlight.shadow.bias = -0.00025;
    this.flashlight.shadow.normalBias = 0.04;
    this.flashlight.userData.baseIntensity = 3.6;
    this.flashlight.userData.emissiveMaterial = this.flashlightLensMaterial;

    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, -1.15, 7);
    this.flashlight.target = this.flashlightTarget;

    this.flashlightGroup.add(handle, head, lens, this.flashlight, this.flashlightTarget);
    this.group.add(this.flashlightGroup);
  }

  setModelVisible(visible) {
    this.modelParts.forEach(part => {
      part.visible = visible;
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
    const turnInput = (this.inputManager.isDown("d") ? 1 : 0) - (this.inputManager.isDown("a") ? 1 : 0);
    const moveInput = (this.inputManager.isDown("w") ? 1 : 0) - (this.inputManager.isDown("s") ? 1 : 0);
    const moving = moveInput !== 0;

    if (turnInput !== 0) {
      this.group.rotation.y -= turnInput * this.turnSpeed * deltaTime;
    }

    if (moving) {
      const forward = new THREE.Vector3(Math.sin(this.group.rotation.y), 0, Math.cos(this.group.rotation.y));
      this.group.position.addScaledVector(forward, moveInput * this.speed * deltaTime);
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
