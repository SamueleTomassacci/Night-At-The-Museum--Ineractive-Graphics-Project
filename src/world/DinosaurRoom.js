import * as THREE from "three";
import { Dinosaur } from "../exhibits/Dinosaur.js";

export class DinosaurRoom {
  constructor(factory) {
    this.group = new THREE.Group();
    this.group.name = "Dinosaur Room";
    this.dinosaur = new Dinosaur();
    this.createRoom(factory);
    this.group.add(this.dinosaur.group);
  }

  createRoom(factory) {
    this.group.add(factory.createFloor(17, 12, [-16.5, 0, 0]));
    this.group.add(factory.createWall(17, 3.5, 0.35, [-16.5, 1.75, -6]));
    this.group.add(factory.createWall(17, 3.5, 0.35, [-16.5, 1.75, 6]));
    this.group.add(factory.createWall(0.35, 3.5, 12, [-25, 1.75, 0]));
    this.group.add(factory.createWall(0.35, 3.5, 4.2, [-8, 1.75, -3.9]));
    this.group.add(factory.createWall(0.35, 3.5, 4.2, [-8, 1.75, 3.9]));
    this.group.add(factory.createSign("T-REX AWAKENING", [-16.5, 3.1, -5.78], 0, 4.8));
    this.group.add(factory.createColumn([-23, 0, -4]));
    this.group.add(factory.createColumn([-23, 0, 4]));
    this.createDisplayRopes(factory);
  }

  createDisplayRopes(factory) {
    const material = factory.materials.gold;
    for (let z of [-2.8, 2.8]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 10, 12), material);
      rail.rotation.z = Math.PI * 0.5;
      rail.position.set(-16.5, 0.8, z);
      rail.castShadow = true;
      this.group.add(rail);
    }
  }
}
