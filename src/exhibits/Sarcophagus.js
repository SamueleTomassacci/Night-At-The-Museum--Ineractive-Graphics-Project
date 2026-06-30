import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";

export class Sarcophagus {
  constructor(materials) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.position.set(0, 0.05, -15);
    this.open = false;
    this.createModel();
  }

  createModel() {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.62, 4), this.materials.sarcophagus);
    base.position.y = 0.54;
    const inner = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.18, 3.25), this.materials.trim);
    inner.position.y = 0.9;
    this.lidPivot = new THREE.Group();
    this.lidPivot.position.set(-1.12, 1.18, 0);
    this.lid = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.3, 4.08), this.materials.sarcophagus);
    this.lid.position.x = 1.12;
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), this.materials.gold);
    face.scale.set(0.72, 1, 0.22);
    face.position.set(1.12, 0.22, -1.25);
    this.lidPivot.add(this.lid, face);
    this.innerLight = new THREE.PointLight(0xffb35f, 0, 7, 1.4);
    this.innerLight.position.set(0, 1.35, 0);
    this.group.add(base, inner, this.lidPivot, this.innerLight);
    this.group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  onClick() {
    this.toggle();
  }

  toggle() {
    this.open = !this.open;
    const lidTween = new TWEEN.Tween(this.lidPivot.rotation)
      .to({ z: this.open ? -1.35 : 0 }, 900)
      .easing(TWEEN.Easing.Cubic.InOut);
    const lightTween = new TWEEN.Tween(this.innerLight)
      .to({ intensity: this.open ? 2.4 : 0 }, 700)
      .easing(TWEEN.Easing.Quadratic.Out);
    TWEEN.add(lidTween, lightTween);
    lidTween.start();
    lightTween.start();
  }

  update(deltaTime, elapsedTime) {
    if (this.open) {
      this.innerLight.intensity = 2.05 + Math.sin(elapsedTime * 6) * 0.25;
    }
  }
}
