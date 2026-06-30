import * as THREE from "three";
import { Paintings } from "../exhibits/Paintings.js";

export class GalleryRoom {
  constructor(factory) {
    this.group = new THREE.Group();
    this.group.name = "Gallery Room";
    this.paintings = new Paintings(factory.materials);
    this.createRoom(factory);
    this.group.add(this.paintings.group);
  }

  createRoom(factory) {
    this.group.add(factory.createFloor(16, 17, [0, 0, 14.5]));
    this.group.add(factory.createWall(16, 4.8, 0.35, [0, 2.4, 23]));
    this.group.add(factory.createWall(0.35, 4.8, 17, [-8, 2.4, 14.5]));
    this.group.add(factory.createWall(0.35, 4.8, 17, [8, 2.4, 14.5]));
    this.group.add(factory.createWall(5.8, 4.8, 0.35, [-5.1, 2.4, 6]));
    this.group.add(factory.createWall(5.8, 4.8, 0.35, [5.1, 2.4, 6]));
    this.group.add(factory.createSign("LIVING CANVASES", [0, 3.15, 22.76], Math.PI, 4.4));
    this.group.add(factory.createBench([0, 0, 12.2], 0));
    this.group.add(factory.createColumn([-6.2, 0, 20.4]));
    this.group.add(factory.createColumn([6.2, 0, 20.4]));
  }
}
