import * as THREE from "three";

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.mode = "day";
    this.enabled = true;
    this.awakening = false;
    this.roomLights = [];
    this.flickerLights = [];
    this.secondaryLights = [];
    this.flashlights = [];
    this.createLights();
    this.setMode(this.mode);
  }

  createLights() {
    this.ambient = new THREE.AmbientLight(0x51639c, 0.35);
    this.scene.add(this.ambient);

    this.addRoomLight("Atrium", [0, 4.35, 0], 0x9bb8ff, 7.5, 24);
    this.addRoomLight("Dinosaur", [-16.5, 4.35, 0], 0x8fa6ff, 7.2, 24, true);
    this.addRoomLight("Statue", [16.5, 4.35, 0], 0xb8c7ff, 6.6, 22, true);
    this.addRoomLight("Gallery", [0, 4.35, 14.5], 0xa9b9ff, 7.0, 23, true);
    this.addRoomLight("Egyptian", [0, 4.35, -14.5], 0xffb05c, 4.8, 22);

    this.dinoSpot = new THREE.SpotLight(0xc7d5ff, 2.2, 18, Math.PI * 0.18, 0.32, 1.2);
    this.dinoSpot.position.set(-16.5, 4.7, 4.4);
    this.dinoSpot.target.position.set(-16.5, 1.3, -0.4);
    this.dinoSpot.castShadow = true;
    this.scene.add(this.dinoSpot, this.dinoSpot.target);
  }

  addRoomLight(name, position, color, intensity, distance, flicker = false) {
    const light = new THREE.SpotLight(color, intensity, distance, Math.PI * 0.33, 0.62, 1.35);
    light.position.set(...position);
    light.target.position.set(position[0], 0.7, position[2]);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.bias = -0.0002;
    light.shadow.normalBias = 0.04;
    light.userData.baseIntensity = intensity;
    light.userData.dayColor = name === "Egyptian" ? 0xffd49a : 0xffffff;
    light.userData.name = name;
    this.roomLights.push(light);
    if (flicker) {
      this.flickerLights.push(light);
    }
    this.scene.add(light, light.target);
    return light;
  }

  createSecondaryWallLight(position) {
    const light = new THREE.PointLight(0xffc982, 0, 5.8, 1.75);
    light.position.set(...position);
    light.castShadow = false;
    light.userData.baseIntensity = 0.82;
    light.userData.emissiveMaterials = [];
    this.secondaryLights.push(light);
    this.scene.add(light);
    return light;
  }

  registerSecondaryEmitter(light, material) {
    if (!light || !material) {
      return;
    }
    light.userData.emissiveMaterials.push(material);
  }

  registerFlashlight(light) {
    if (!light) {
      return;
    }
    this.flashlights.push(light);
    this.setMode(this.mode);
  }

  setMode(mode) {
    const modes = {
      off: {
        background: 0x02040a,
        fog: 0x02040a,
        fogDensity: 0.016,
        ambientColor: 0x26304c,
        ambient: 0.045,
        roomScalar: 0,
        secondaryScalar: 1,
        flashlightScalar: 1,
        dinoSpot: 0
      },
      day: {
        background: 0xc9ddff,
        fog: 0xd8e8ff,
        fogDensity: 0.005,
        ambientColor: 0xffffff,
        ambient: 0.45,
        roomScalar: 1,
        secondaryScalar: 0,
        flashlightScalar: 0,
        dinoSpot: this.awakening ? 1.55 : 0.95
      }
    };
    const selected = modes[mode] ?? modes.day;
    this.mode = modes[mode] ? mode : "day";
    this.enabled = this.mode !== "off";
    this.scene.background.setHex(selected.background);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(selected.fog);
      this.scene.fog.density = selected.fogDensity;
    }
    this.ambient.color.setHex(selected.ambientColor);
    this.ambient.intensity = selected.ambient;
    this.roomLights.forEach(light => {
      light.color.setHex(light.userData.dayColor);
      light.intensity = light.userData.baseIntensity * selected.roomScalar;
      light.userData.currentScalar = selected.roomScalar;
    });
    this.secondaryLights.forEach(light => {
      light.intensity = light.userData.baseIntensity * selected.secondaryScalar;
      light.userData.currentScalar = selected.secondaryScalar;
      light.userData.emissiveMaterials.forEach(material => {
        material.emissiveIntensity = selected.secondaryScalar * 1.35;
      });
    });
    this.flashlights.forEach(light => {
      light.intensity = light.userData.baseIntensity * selected.flashlightScalar;
      if (light.userData.emissiveMaterial) {
        light.userData.emissiveMaterial.emissiveIntensity = selected.flashlightScalar * 1.8;
      }
    });
    this.dinoSpot.color.setHex(0xffffff);
    this.dinoSpot.intensity = selected.dinoSpot;
    return this.mode;
  }

  cycleMode() {
    const modes = ["off", "day"];
    const next = modes[(modes.indexOf(this.mode) + 1) % modes.length];
    return this.setMode(next);
  }

  setAwakening(enabled = true) {
    this.awakening = enabled;
    this.setMode(this.mode);
  }

  update(deltaTime, elapsedTime) {
    if (this.mode === "day" && this.awakening) {
      this.flickerLights.forEach((light, index) => {
        const pulse = Math.sin(elapsedTime * (8.5 + index) + index * 3.1) * 0.18 + Math.random() * 0.08;
        light.intensity = Math.max(0.15, light.userData.baseIntensity * light.userData.currentScalar + pulse * 0.35);
      });
    }
  }
}
