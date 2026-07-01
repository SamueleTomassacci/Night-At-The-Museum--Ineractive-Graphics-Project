import * as THREE from "three";
import { CAMERA_LABELS, CAMERA_MODES } from "../utils/constants.js";
import { damp } from "../utils/math.js";

export class CameraManager {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 160);
    this.modeIndex = 0;
    this.mode = CAMERA_MODES[this.modeIndex];
    this.target = new THREE.Vector3();
    this.offset = new THREE.Vector3(0, 2.8, 4.6);
    this.firstPersonOffset = new THREE.Vector3(0, 1.78, 0);
    this.forward = new THREE.Vector3();
    this.panoramaAngle = 0;
    this.camera.position.set(0, 3.2, 5.2);
  }

  zoom(deltaY) {
    const direction = Math.sign(deltaY);
    if (direction === 0) return this.camera.zoom;

    const zoomStep = 1.1;
    this.camera.zoom = THREE.MathUtils.clamp(
      this.camera.zoom * (direction < 0 ? zoomStep : 1 / zoomStep),
      0.5,
      2
    );
    this.camera.updateProjectionMatrix();
    return this.camera.zoom;
  }

  cycleMode() {
    this.modeIndex = (this.modeIndex + 1) % CAMERA_MODES.length;
    this.mode = CAMERA_MODES[this.modeIndex];
    return this.mode;
  }

  getLabel() {
    return CAMERA_LABELS[this.mode];
  }

  isOverheadView() {
    return this.mode === "topDown" || this.mode === "panorama";
  }

  update(player, deltaTime, elapsedTime) {
    const playerPosition = player.group.position;
    player.group.visible = this.mode !== "firstPerson";
    this.target.set(playerPosition.x, playerPosition.y + 1.3, playerPosition.z);
    this.forward.set(Math.sin(player.group.rotation.y), 0, Math.cos(player.group.rotation.y));

    if (this.mode === "thirdPerson") {
      const behind = new THREE.Vector3(
        this.forward.x * -this.offset.z,
        this.offset.y,
        this.forward.z * -this.offset.z
      );
      const desired = playerPosition.clone().add(behind);
      this.camera.position.x = damp(this.camera.position.x, desired.x, 7, deltaTime);
      this.camera.position.y = damp(this.camera.position.y, desired.y, 7, deltaTime);
      this.camera.position.z = damp(this.camera.position.z, desired.z, 7, deltaTime);
      this.camera.lookAt(this.target);
    }

    if (this.mode === "firstPerson") {
      const desired = playerPosition.clone().add(this.firstPersonOffset).addScaledVector(this.forward, 0.18);
      this.camera.position.copy(desired);
      this.camera.lookAt(desired.clone().addScaledVector(this.forward, 10));
    }

    if (this.mode === "topDown") {
      const desired = new THREE.Vector3(playerPosition.x, 30, playerPosition.z + 0.01);
      this.camera.position.lerp(desired, 1 - Math.exp(-5 * deltaTime));
      this.camera.lookAt(playerPosition.x, 0, playerPosition.z);
    }

    if (this.mode === "panorama") {
      this.panoramaAngle += deltaTime * 0.22;
      const radius = 31;
      this.camera.position.set(Math.cos(this.panoramaAngle) * radius, 17 + Math.sin(elapsedTime * 0.25) * 2, Math.sin(this.panoramaAngle) * radius);
      this.camera.lookAt(0, 1.8, 0);
    }
  }
}
