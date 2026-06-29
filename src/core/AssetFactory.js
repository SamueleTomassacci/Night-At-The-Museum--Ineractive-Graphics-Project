import * as THREE from "three";

export class AssetFactory {
  constructor(materials) {
    this.materials = materials;
  }

  mesh(geometry, material, position = [0, 0, 0], castShadow = true, receiveShadow = true) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    return mesh;
  }

  createFloor(width, depth, position = [0, 0, 0]) {
    const mesh = this.mesh(new THREE.BoxGeometry(width, 0.16, depth), this.materials.floor, [position[0], -0.08, position[2]], false, true);
    return mesh;
  }

  createWall(width, height, depth, position) {
    return this.mesh(new THREE.BoxGeometry(width, height, depth), this.materials.wall, position, true, true);
  }

  createColumn(position, height = 4.2) {
    const group = new THREE.Group();
    const base = this.mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.34, 20), this.materials.trim, [0, 0.17, 0]);
    const shaft = this.mesh(new THREE.CylinderGeometry(0.36, 0.42, height, 24), this.materials.wall, [0, height / 2 + 0.34, 0]);
    const cap = this.mesh(new THREE.CylinderGeometry(0.64, 0.52, 0.32, 20), this.materials.trim, [0, height + 0.64, 0]);
    group.add(base, shaft, cap);
    group.position.set(...position);
    return group;
  }

  createDoorFrame(position, rotationY = 0) {
    const group = new THREE.Group();
    const sideA = this.mesh(new THREE.BoxGeometry(0.35, 3.2, 0.35), this.materials.wood, [-1.3, 1.6, 0]);
    const sideB = this.mesh(new THREE.BoxGeometry(0.35, 3.2, 0.35), this.materials.wood, [1.3, 1.6, 0]);
    const top = this.mesh(new THREE.BoxGeometry(3, 0.36, 0.38), this.materials.wood, [0, 3.25, 0]);
    group.add(sideA, sideB, top);
    group.position.set(...position);
    group.rotation.y = rotationY;
    return group;
  }

  createSign(text, position, rotationY = 0, width = 3.1) {
    const group = new THREE.Group();
    const sign = this.mesh(new THREE.BoxGeometry(width, 0.7, 0.12), this.materials.sign, [0, 0, 0], true, false);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    context.fillStyle = "#10182a";
    context.fillRect(0, 0, 512, 128);
    context.strokeStyle = "#e9c477";
    context.lineWidth = 8;
    context.strokeRect(10, 10, 492, 108);
    context.fillStyle = "#ffe3a6";
    context.font = "bold 40px serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 256, 67);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const label = this.mesh(new THREE.PlaneGeometry(width * 0.92, 0.52), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }), [0, 0, 0.065], false, false);
    group.add(sign, label);
    group.position.set(...position);
    group.rotation.y = rotationY;
    return group;
  }

  createBench(position, rotationY = 0) {
    const group = new THREE.Group();
    const seat = this.mesh(new THREE.BoxGeometry(3.4, 0.24, 0.7), this.materials.wood, [0, 0.75, 0]);
    const back = this.mesh(new THREE.BoxGeometry(3.4, 0.7, 0.18), this.materials.wood, [0, 1.08, 0.34]);
    const legA = this.mesh(new THREE.BoxGeometry(0.18, 0.75, 0.18), this.materials.trim, [-1.35, 0.36, -0.2]);
    const legB = this.mesh(new THREE.BoxGeometry(0.18, 0.75, 0.18), this.materials.trim, [1.35, 0.36, -0.2]);
    group.add(seat, back, legA, legB);
    group.position.set(...position);
    group.rotation.y = rotationY;
    return group;
  }
}
