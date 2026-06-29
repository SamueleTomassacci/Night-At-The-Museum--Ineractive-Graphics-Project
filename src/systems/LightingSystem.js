import * as THREE from "three";
import { COLORS } from "../utils/constants.js";

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.enabled = true;
    this.awakening = false;
    this.roomLights = [];
    this.flickerLights = [];
    this.egyptianTorches = [];
    this.createLights();
  }

  createLights() {
    this.ambient = new THREE.AmbientLight(0x51639c, 0.34);
    this.hemi = new THREE.HemisphereLight(0x90a8ff, 0x141018, 0.55);
    this.directional = new THREE.DirectionalLight(0x889dff, 1.2);
    this.directional.position.set(4, 12, 8);
    this.directional.castShadow = true;
    this.directional.shadow.mapSize.set(2048, 2048);
    this.directional.shadow.camera.left = -35;
    this.directional.shadow.camera.right = 35;
    this.directional.shadow.camera.top = 35;
    this.directional.shadow.camera.bottom = -35;
    this.scene.add(this.ambient, this.hemi, this.directional);

    this.addRoomLight("Atrium", [0, 4.8, 0], 0x9bb8ff, 1.4, 15);
    this.addRoomLight("Dinosaur", [-16.5, 5.2, 0], 0x8fa6ff, 1.35, 15, true);
    this.addRoomLight("Statue", [16.5, 5, 0], 0xb8c7ff, 1.15, 13, true);
    this.addRoomLight("Gallery", [0, 4.6, 14.5], 0xa9b9ff, 1.18, 14, true);
    this.addRoomLight("Egyptian", [0, 4.6, -14.5], 0xffb05c, 0.65, 13);

    this.dinoSpot = new THREE.SpotLight(0xc7d5ff, 2.2, 18, Math.PI * 0.18, 0.32, 1.2);
    this.dinoSpot.position.set(-16.5, 7.8, 4.4);
    this.dinoSpot.target.position.set(-16.5, 1.3, -0.4);
    this.dinoSpot.castShadow = true;
    this.scene.add(this.dinoSpot, this.dinoSpot.target);
  }

  addRoomLight(name, position, color, intensity, distance, flicker = false) {
    const light = new THREE.PointLight(color, intensity, distance, 1.6);
    light.position.set(...position);
    light.castShadow = true;
    light.userData.baseIntensity = intensity;
    light.userData.name = name;
    this.roomLights.push(light);
    if (flicker) {
      this.flickerLights.push(light);
    }
    this.scene.add(light);
    return light;
  }

  createTorch(position) {
    const light = new THREE.PointLight(COLORS.torch, 0.55, 7.5, 1.8);
    light.position.set(...position);
    light.castShadow = true;
    light.userData.baseIntensity = 0.55;
    this.egyptianTorches.push(light);
    this.flickerLights.push(light);
    this.scene.add(light);
    return light;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    const scalar = enabled ? 1 : 0.08;
    this.ambient.intensity = 0.34 * scalar;
    this.hemi.intensity = 0.55 * scalar;
    this.directional.intensity = 1.2 * scalar;
    this.roomLights.forEach(light => {
      light.intensity = light.userData.baseIntensity * scalar;
    });
    this.egyptianTorches.forEach(light => {
      light.intensity = light.userData.baseIntensity * scalar;
    });
    this.dinoSpot.intensity = 2.2 * scalar;
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  setAwakening(enabled = true) {
    this.awakening = enabled;
    if (enabled) {
      this.dinoSpot.color.setHex(0xffffff);
      this.dinoSpot.intensity = this.enabled ? 3.4 : 0.08;
    }
  }

  boostEgyptianTorches(active) {
    this.egyptianTorches.forEach(light => {
      light.userData.baseIntensity = active ? 1.45 : 0.55;
    });
  }

  update(deltaTime, elapsedTime) {
    if (!this.enabled) {
      return;
    }
    if (this.awakening) {
      this.flickerLights.forEach((light, index) => {
        const pulse = Math.sin(elapsedTime * (8.5 + index) + index * 3.1) * 0.18 + Math.random() * 0.08;
        light.intensity = Math.max(0.15, light.userData.baseIntensity + pulse);
      });
    }
    this.egyptianTorches.forEach((light, index) => {
      light.intensity = light.userData.baseIntensity + Math.sin(elapsedTime * 9 + index) * 0.12;
    });
  }
}
