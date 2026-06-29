import * as THREE from "three";

export class InteractionManager {
  constructor(camera, inputManager) {
    this.camera = camera;
    this.inputManager = inputManager;
    this.raycaster = new THREE.Raycaster();
    this.clickables = new Set();
    inputManager.addEventListener("click", event => this.handleClick(event.detail.pointer));
  }

  register(object, target = object) {
    object.traverse(child => {
      child.userData.clickable = target;
      this.clickables.add(child);
    });
  }

  handleClick(pointer) {
    this.raycaster.setFromCamera(pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.clickables], true);
    const hit = hits.find(item => item.object.userData.clickable);
    if (hit?.object.userData.clickable?.onClick) {
      hit.object.userData.clickable.onClick(hit);
    }
  }
}
