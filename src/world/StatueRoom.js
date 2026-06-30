import * as THREE from "three";
import { Statue } from "../exhibits/Statue.js";

export class StatueRoom {
  constructor(factory) {
    this.group = new THREE.Group();
    this.group.name = "Statue Room";
    this.statue = new Statue(factory.materials);
    this.createRoom(factory);
    this.group.add(this.statue.group);
  }

  createRoom(factory) {
    this.group.add(factory.createFloor(17, 12, [16.5, 0, 0]));
    this.group.add(factory.createWall(17, 5.0, 0.35, [16.5, 2.5, -6]));
    this.group.add(factory.createWall(17, 5.0, 0.35, [16.5, 2.5, 6]));
    this.group.add(factory.createWall(0.35, 5.0, 12, [25, 2.5, 0]));
    this.group.add(factory.createWall(0.35, 5.0, 4.2, [8, 2.5, -3.9]));
    this.group.add(factory.createWall(0.35, 5.0, 4.2, [8, 2.5, 3.9]));
    this.group.add(factory.createSign("MARBLE GUARDIAN", [16.5, 3.15, -5.76], 0, 4.6));
    this.group.add(factory.createColumn([23, 0, -4]));
    this.group.add(factory.createColumn([23, 0, 4]));
    this.group.add(factory.createBench([16.5, 0, 4.45], Math.PI));
  }
}
