import * as THREE from "three";

export class Hall {
  constructor(factory, clock) {
    this.group = new THREE.Group();
    this.group.name = "Central Atrium";
    this.group.add(factory.createFloor(16, 12, [0, 0, 0]));
    this.group.add(factory.createDoorFrame([-8, 0, 0], Math.PI * 0.5));
    this.group.add(factory.createDoorFrame([8, 0, 0], Math.PI * 0.5));
    this.group.add(factory.createDoorFrame([0, 0, -6], 0));
    this.group.add(factory.createDoorFrame([0, 0, 6], 0));
    this.group.add(factory.createSign("DINOSAUR", [-7.66, 3.9, 0], Math.PI * 0.5, 3));
    this.group.add(factory.createSign("STATUE", [7.66, 3.9, 0], -Math.PI * 0.5, 2.6));
    this.group.add(factory.createSign("EGYPT", [0, 3.9, -5.66], 0, 2.4));
    this.group.add(factory.createSign("GALLERY", [0, 3.9, 5.66], Math.PI, 2.8));
    this.group.add(factory.createColumn([-5.9, 0, -4.1]));
    this.group.add(factory.createColumn([5.9, 0, -4.1]));
    this.group.add(factory.createColumn([-5.9, 0, 4.1]));
    this.group.add(factory.createColumn([5.9, 0, 4.1]));
    this.group.add(factory.createBench([-2.8, 0, 2.8], Math.PI * 0.5));
    this.group.add(factory.createBench([2.8, 0, 2.8], -Math.PI * 0.5));
    this.group.add(clock.group);
  }
}
