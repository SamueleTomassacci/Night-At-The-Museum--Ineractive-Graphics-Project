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
    this.group.add(factory.createWall(17, 4.8, 0.35, [16.5, 2.4, -6]));
    this.group.add(factory.createWall(17, 4.8, 0.35, [16.5, 2.4, 6]));
    this.group.add(factory.createWall(0.35, 4.8, 12, [25, 2.4, 0]));
    this.group.add(factory.createWall(0.35, 4.8, 4.2, [8, 2.4, -3.9]));
    this.group.add(factory.createWall(0.35, 4.8, 4.2, [8, 2.4, 3.9]));
    this.group.add(factory.createSign("MARBLE GUARDIAN", [16.5, 3.15, -5.76], 0, 4.6));
    this.group.add(factory.createColumn([23, 0, -4]));
    this.group.add(factory.createColumn([23, 0, 4]));
    this.group.add(factory.createBench([16.5, 0, 4.45], Math.PI));
  }
}
