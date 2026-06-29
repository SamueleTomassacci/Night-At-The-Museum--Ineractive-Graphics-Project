import * as THREE from "three";

export class InputManager extends EventTarget {
  constructor(domElement) {
    super();
    this.domElement = domElement;
    this.keys = new Set();
    this.pointer = new THREE.Vector2();
    this.pointerScreen = { x: 0, y: 0 };

    window.addEventListener("keydown", event => {
      const key = event.key.toLowerCase();
      if (!this.keys.has(key)) {
        this.dispatchEvent(new CustomEvent("keyPressed", { detail: key }));
      }
      this.keys.add(key);
    });

    window.addEventListener("keyup", event => {
      this.keys.delete(event.key.toLowerCase());
    });

    domElement.addEventListener("pointermove", event => this.updatePointer(event));
    domElement.addEventListener("click", event => {
      this.updatePointer(event);
      this.dispatchEvent(new CustomEvent("click", { detail: { pointer: this.pointer.clone(), event } }));
    });
  }

  updatePointer(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.pointerScreen.x = event.clientX;
    this.pointerScreen.y = event.clientY;
  }

  isDown(...keys) {
    return keys.some(key => this.keys.has(key.toLowerCase()));
  }

  getMovementVector() {
    const x = (this.isDown("d", "arrowright") ? 1 : 0) - (this.isDown("a", "arrowleft") ? 1 : 0);
    const z = (this.isDown("s", "arrowdown") ? 1 : 0) - (this.isDown("w", "arrowup") ? 1 : 0);
    const vector = new THREE.Vector3(x, 0, z);
    if (vector.lengthSq() > 0) {
      vector.normalize();
    }
    return vector;
  }
}
