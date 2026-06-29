import * as THREE from "three";
import { COLORS } from "../utils/constants.js";

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.mode = "blue";
    this.enabled = true;
    this.awakening = false;
    this.roomLights = [];
    this.flickerLights = [];
    this.egyptianTorches = [];
    this.createLights();
    this.setMode(this.mode);
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
    light.userData.blueColor = color;
    light.userData.dayColor = name === "Egyptian" ? 0xffd49a : 0xffffff;
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
    light.userData.blueColor = COLORS.torch;
    light.userData.dayColor = 0xffd9a6;
    this.egyptianTorches.push(light);
    this.flickerLights.push(light);
    this.scene.add(light);
    return light;
  }

  setMode(mode) {
    const modes = {
      off: {
        background: 0x02040a,
        fog: 0x02040a,
        fogDensity: 0.016,
        ambientColor: 0x26304c,
        ambient: 0.04,
        hemiSky: 0x26304c,
        hemiGround: 0x04030a,
        hemi: 0.04,
        directionalColor: 0x4f5f91,
        directional: 0.05,
        roomScalar: 0,
        torchScalar: 0,
        dinoSpot: 0
      },
      blue: {
        background: 0x101936,
        fog: 0x101936,
        fogDensity: 0.014,
        ambientColor: 0x6f83c6,
        ambient: 0.62,
        hemiSky: 0xa8bfff,
        hemiGround: 0x191220,
        hemi: 0.92,
        directionalColor: 0xb8c6ff,
        directional: 1.7,
        roomScalar: 1.35,
        torchScalar: 1.2,
        dinoSpot: this.awakening ? 3.4 : 2.55
      },
      day: {
        background: 0xc9ddff,
        fog: 0xd8e8ff,
        fogDensity: 0.005,
        ambientColor: 0xffffff,
        ambient: 1.28,
        hemiSky: 0xffffff,
        hemiGround: 0xd6c4aa,
        hemi: 1.55,
        directionalColor: 0xfff5df,
        directional: 2.75,
        roomScalar: 0.8,
        torchScalar: 0.25,
        dinoSpot: this.awakening ? 1.55 : 0.95
      }
    };
    const selected = modes[mode] ?? modes.blue;
    this.mode = modes[mode] ? mode : "blue";
    this.enabled = this.mode !== "off";
    this.scene.background.setHex(selected.background);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(selected.fog);
      this.scene.fog.density = selected.fogDensity;
    }
    this.ambient.color.setHex(selected.ambientColor);
    this.ambient.intensity = selected.ambient;
    this.hemi.color.setHex(selected.hemiSky);
    this.hemi.groundColor.setHex(selected.hemiGround);
    this.hemi.intensity = selected.hemi;
    this.directional.color.setHex(selected.directionalColor);
    this.directional.intensity = selected.directional;
    this.roomLights.forEach(light => {
      light.color.setHex(this.mode === "day" ? light.userData.dayColor : light.userData.blueColor);
      light.intensity = light.userData.baseIntensity * selected.roomScalar;
      light.userData.currentScalar = selected.roomScalar;
    });
    this.egyptianTorches.forEach(light => {
      light.color.setHex(this.mode === "day" ? light.userData.dayColor : light.userData.blueColor);
      light.intensity = light.userData.baseIntensity * selected.torchScalar;
      light.userData.currentScalar = selected.torchScalar;
    });
    this.dinoSpot.color.setHex(this.mode === "day" ? 0xffffff : 0xc7d5ff);
    this.dinoSpot.intensity = selected.dinoSpot;
    return this.mode;
  }

  cycleMode() {
    const modes = ["off", "blue", "day"];
    const next = modes[(modes.indexOf(this.mode) + 1) % modes.length];
    return this.setMode(next);
  }

  setAwakening(enabled = true) {
    this.awakening = enabled;
    this.setMode(this.mode);
  }

  boostEgyptianTorches(active) {
    this.egyptianTorches.forEach(light => {
      light.userData.baseIntensity = active ? 1.45 : 0.55;
    });
  }

  update(deltaTime, elapsedTime) {
    if (this.mode === "off") {
      return;
    }
    if (this.awakening) {
      this.flickerLights.forEach((light, index) => {
        const pulse = Math.sin(elapsedTime * (8.5 + index) + index * 3.1) * 0.18 + Math.random() * 0.08;
        const scalar = this.mode === "day" ? 0.35 : 1;
        light.intensity = Math.max(0.15, light.userData.baseIntensity * light.userData.currentScalar + pulse * scalar);
      });
    }
    this.egyptianTorches.forEach((light, index) => {
      const scalar = this.mode === "day" ? 0.25 : 1.2;
      light.intensity = light.userData.baseIntensity * scalar + Math.sin(elapsedTime * 9 + index) * 0.12 * scalar;
    });
  }
}
