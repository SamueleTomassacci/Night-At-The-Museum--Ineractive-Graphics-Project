import * as THREE from "three";

export class Clock {
  constructor(materials, onMidnight) {
    this.materials = materials;
    this.onMidnight = onMidnight;
    this.group = new THREE.Group();
    this.group.position.set(0, 2.8, -5.72);
    this.progress = 0;
    this.done = false;
    this.createModel();
  }

  createModel() {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.16, 48), this.materials.wood);
    rim.rotation.x = Math.PI * 0.5;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.98, 48), new THREE.MeshStandardMaterial({ color: 0xf2ead7, roughness: 0.42 }));
    face.position.z = -0.09;
    this.hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.56, 0.045), this.materials.trim);
    this.hourHand.geometry.translate(0, 0.25, 0);
    this.hourHand.position.z = -0.14;
    this.minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.82, 0.04), this.materials.gold);
    this.minuteHand.geometry.translate(0, 0.36, 0);
    this.minuteHand.position.z = -0.17;
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 10), this.materials.gold);
    center.position.z = -0.22;
    this.group.add(rim, face, this.hourHand, this.minuteHand, center);
    for (let i = 0; i < 12; i += 1) {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.19, 0.04), this.materials.trim);
      const angle = (i / 12) * Math.PI * 2;
      mark.position.set(Math.sin(angle) * 0.8, Math.cos(angle) * 0.8, -0.2);
      mark.rotation.z = -angle;
      this.group.add(mark);
    }
  }

  update(deltaTime) {
    if (this.done) {
      return;
    }
    this.progress = Math.min(1, this.progress + deltaTime * 0.16);
    const minutes = this.progress * 720;
    this.minuteHand.rotation.z = -minutes * Math.PI * 2 / 60;
    this.hourHand.rotation.z = -minutes * Math.PI * 2 / 720;
    if (this.progress >= 1) {
      this.done = true;
      this.minuteHand.rotation.z = 0;
      this.hourHand.rotation.z = 0;
      this.onMidnight?.();
    }
  }
}
