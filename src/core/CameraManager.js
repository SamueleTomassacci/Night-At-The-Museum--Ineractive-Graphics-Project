import * as THREE from "three";
import { CAMERA_LABELS, CAMERA_MODES } from "../utils/constants.js";
import { damp } from "../utils/math.js";

const FIRST_PERSON_MAX_YAW =THREE.MathUtils.degToRad(75);
const DEFAULT_CAMERA_UP =new THREE.Vector3(0,1, 0);
const TOP_DOWN_CAMERA_UP = new THREE.Vector3(0,0, -1);
const TOP_DOWN_CAMERA_POSITION = new THREE.Vector3(0,52, 0);
const TOP_DOWN_CAMERA_TARGET = new THREE.Vector3(0,0,0);

export class CameraManager {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(58,window.innerWidth / window.innerHeight, 0.1, 160);
    this.modeIndex= 0;
    this.mode = CAMERA_MODES[this.modeIndex];
    this.target = new THREE.Vector3();
    this.offset = new THREE.Vector3(0,2.8, 4.6);
    this.cameraDistance = Math.hypot(1.5,this.offset.z);
    this.cameraYaw = 0;
    this.cameraPitch = Math.atan2(1.5,this.offset.z);
    this.cameraSensitivity = 0.005;
    this.lastPlayerYaw = null;
    this.firstPersonOffset = new THREE.Vector3(0,1.78, 0);
    this.forward = new THREE.Vector3();
    this.panoramaAngle = 0;
    this.camera.position.set(0,3.2,5.2);
  }

  zoom(deltaY) {
    const direction =Math.sign(deltaY);
    if (direction=== 0) {
      return this.camera.zoom;
    }

    const zoomStep = 1.1;
    this.camera.zoom = THREE.MathUtils.clamp(
      this.camera.zoom *(direction<0 ? zoomStep : 1 / zoomStep),
      0.5,
      2
    );
    this.camera.updateProjectionMatrix();   //to update the parameters of the camera 
    return this.camera.zoom;
  }

  orbit(deltaX, deltaY) {
    if(this.mode === "topDown") {
      return;
    }

    this.cameraYaw -= deltaX*this.cameraSensitivity;
    this.clampFirstPersonYaw();
    const verticalDelta = deltaY*this.cameraSensitivity;
    this.cameraPitch = THREE.MathUtils.clamp(
      this.cameraPitch +(this.mode === "firstPerson" ? verticalDelta : -verticalDelta),
      this.mode === "firstPerson" ? -0.8 : -0.25,
      0.6
    );
  }

  clampFirstPersonYaw() {
    if(this.mode !== "firstPerson") {
      return;
    }

    const playerYaw =this.lastPlayerYaw ?? 0;
    const yawOffset = Math.atan2(
      Math.sin(this.cameraYaw- playerYaw),
      Math.cos(this.cameraYaw - playerYaw)
    );
    this.cameraYaw = playerYaw + THREE.MathUtils.clamp(
      yawOffset,
      -FIRST_PERSON_MAX_YAW,
      FIRST_PERSON_MAX_YAW
    );
  }

  getAimDirection() {
    const horizontal =Math.cos(this.cameraPitch);
    return new THREE.Vector3(
      Math.sin(this.cameraYaw)*horizontal,
      -Math.sin(this.cameraPitch),
      Math.cos(this.cameraYaw)*horizontal
    ).normalize();
  }

  cycleMode() {
    this.modeIndex = (this.modeIndex +1) % CAMERA_MODES.length;
    this.mode = CAMERA_MODES[this.modeIndex];
    this.clampFirstPersonYaw();
    return this.mode;
  }

  getLabel() {
    return CAMERA_LABELS[this.mode];
  }

  isOverheadView() {
    return this.mode === "topDown"|| this.mode === "panorama";
  }

  isFirstPerson() {
    return this.mode === "firstPerson";
  }

  update(player, deltaTime, elapsedTime) {
    const playerPosition =player.group.position;
    const playerYaw = player.group.rotation.y;

    if(this.lastPlayerYaw === null) {
      this.lastPlayerYaw = playerYaw;
    } else {
      const playerYawDelta = Math.atan2(
        Math.sin(playerYaw-this.lastPlayerYaw),
        Math.cos(playerYaw - this.lastPlayerYaw)
      );
      this.cameraYaw += playerYawDelta;
      this.lastPlayerYaw = playerYaw;
    }

    player.group.visible = true;
    player.setModelVisible(true);
    this.target.set(playerPosition.x, playerPosition.y+1.3, playerPosition.z);
    this.forward.set(Math.sin(player.group.rotation.y),0, Math.cos(player.group.rotation.y));

    if(this.mode === "thirdPerson") {
      this.camera.up.copy(DEFAULT_CAMERA_UP);
      const horizontalDistance = Math.cos(this.cameraPitch)*this.cameraDistance;
      const desiredCameraPosition = this.target.clone().add(new THREE.Vector3(
        -Math.sin(this.cameraYaw)*horizontalDistance,
        Math.sin(this.cameraPitch)*this.cameraDistance,
        -Math.cos(this.cameraYaw)*horizontalDistance
      ));
      this.camera.position.x = damp(this.camera.position.x,desiredCameraPosition.x, 7, deltaTime);
      this.camera.position.y = damp(this.camera.position.y,desiredCameraPosition.y, 7,deltaTime);
      this.camera.position.z = damp(this.camera.position.z, desiredCameraPosition.z,7, deltaTime);
      this.camera.lookAt(this.target);
    }

    if(this.mode === "firstPerson") {
      this.camera.up.copy(DEFAULT_CAMERA_UP);
      const eyePosition = playerPosition.clone().add(this.firstPersonOffset).addScaledVector(this.forward,0.18);
      this.camera.position.copy(eyePosition);
      this.camera.lookAt(eyePosition.clone().addScaledVector(this.getAimDirection(),10));
    }

    if(this.mode === "topDown") {
      this.camera.up.copy(TOP_DOWN_CAMERA_UP);
      this.camera.position.copy(TOP_DOWN_CAMERA_POSITION);
      this.camera.lookAt(TOP_DOWN_CAMERA_TARGET);
    }

    if(this.mode === "panorama") {
      this.camera.up.copy(DEFAULT_CAMERA_UP);
      this.panoramaAngle += deltaTime*0.22;
      const radius = 31;
      this.camera.position.set(Math.cos(this.panoramaAngle)*radius, 17 + Math.sin(elapsedTime*0.25) * 2, Math.sin(this.panoramaAngle)*radius);
      this.camera.lookAt(0,1.8, 0);
    }
  }
}
