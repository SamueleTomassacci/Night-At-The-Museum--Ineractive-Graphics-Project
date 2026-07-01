import * as THREE from "three";
import { Sarcophagus } from "../exhibits/Sarcophagus.js";
import { addWallSconce } from "./wallSconces.js";

export class EgyptianRoom {
  constructor(factory, lightingSystem) {
    this.group = new THREE.Group();
    this.group.name = "Egyptian Room";
    this.sarcophagus = new Sarcophagus(factory.materials);
    this.createRoom(factory, lightingSystem);
    this.group.add(this.sarcophagus.group);
  }

  createRoom(factory, lightingSystem) {
    this.group.add(factory.createFloor(16, 17, [0, 0, -14.5]));
    this.group.add(factory.createWall(16, 5.0, 0.35, [0, 2.5, -23]));
    this.group.add(factory.createWall(0.35, 5.0, 17, [-8, 2.5, -14.5]));
    this.group.add(factory.createWall(0.35, 5.0, 17, [8, 2.5, -14.5]));
    this.group.add(factory.createWall(5.8, 5.0, 0.35, [-5.1, 2.5, -6]));
    this.group.add(factory.createWall(5.8, 5.0, 0.35, [5.1, 2.5, -6]));
    this.group.add(factory.createSign("EGYPTIAN WING", [0, 3.15, -22.76], 0, 4.2));
    this.addObelisks(factory);
    this.group.add(factory.createCeilingLight([0, 4.95, -14.5], 1.35));
    this.addWallSconces(factory, lightingSystem);
  }

  addWallSconces(factory, lightingSystem) {
    addWallSconce(this.group, factory, lightingSystem, [-7.76, 2.45, -10.4], Math.PI * 0.5);
    addWallSconce(this.group, factory, lightingSystem, [-7.76, 2.45, -18.6], Math.PI * 0.5);
    addWallSconce(this.group, factory, lightingSystem, [7.76, 2.45, -10.4], -Math.PI * 0.5);
    addWallSconce(this.group, factory, lightingSystem, [7.76, 2.45, -18.6], -Math.PI * 0.5);
  }

  addObelisks(factory) {
    for (let x of [-4.8, 4.8]) {
      const group = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.7, 0.55), factory.materials.sarcophagus);
      shaft.position.y = 1.35;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.8, 4), factory.materials.gold);
      cap.position.y = 3.1;
      cap.rotation.y = Math.PI * 0.25;
      group.add(shaft, cap);
      group.position.set(x, 0, -11.2);
      group.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.group.add(group);
    }
  }
}
