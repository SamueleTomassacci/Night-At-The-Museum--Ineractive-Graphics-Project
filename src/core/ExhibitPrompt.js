import * as THREE from "three";

const PROMPT_DISTANCE = 5.2;

export class ExhibitPromptSystem {
  constructor(player, exhibits) {
    this.player = player;
    this.exhibits = exhibits;
    this.playerPosition = new THREE.Vector3();
    this.exhibitPosition = new THREE.Vector3();
    this.prompt = this.createPrompt();
  }

  createPrompt() {
    const prompt = document.createElement("div");
    prompt.style.position = "fixed";
    prompt.style.left = "50%";
    prompt.style.bottom = "112px";
    prompt.style.transform = "translateX(-50%)";
    prompt.style.padding = "10px 16px";
    prompt.style.border = "1px solid rgba(255, 228, 174, 0.65)";
    prompt.style.borderRadius = "6px";
    prompt.style.background = "rgba(12, 17, 28, 0.78)";
    prompt.style.color = "#ffe4ae";
    prompt.style.font = "600 18px/1.2 system-ui, sans-serif";
    prompt.style.letterSpacing = "0";
    prompt.style.pointerEvents = "none";
    prompt.style.display = "none";
    prompt.style.zIndex = "20";
    document.body.appendChild(prompt);
    return prompt;
  }

  update() {
    const activeExhibit = this.findNearestExhibit();

    if (!activeExhibit) {
      this.prompt.style.display = "none";
      return;
    }

    this.prompt.textContent = activeExhibit.message();
    this.prompt.style.display = "block";
  }

  removeExhibits() {
    const removedObjects = new Set();
    for (let i = 0; i < arguments.length; i += 1) {
      removedObjects.add(arguments[i]);
    }
    this.exhibits = this.exhibits.filter(exhibit => !removedObjects.has(exhibit.object));
    this.prompt.style.display = "none";
  }

  findNearestExhibit() {
    this.player.group.getWorldPosition(this.playerPosition);

    let nearest = null;
    let nearestDistance = PROMPT_DISTANCE;

    this.exhibits.forEach(exhibit => {
      const group = exhibit.object.group;
      group.getWorldPosition(this.exhibitPosition);

      const distance = this.distance2D(this.playerPosition, this.exhibitPosition);

      if (distance <= nearestDistance) {
        nearest = exhibit;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  distance2D(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.hypot(dx, dz);
  }
}
