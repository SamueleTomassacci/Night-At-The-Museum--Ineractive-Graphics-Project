import { CAMERA_LABELS } from "../utils/constants.js";

export class UIController extends EventTarget {
  constructor(root) {
    super();
    this.root = root;
    this.values = {
      camera: CAMERA_LABELS.thirdPerson,
      lights: "Main Lighting",
      shadows: "on",
      quality: "medium"
    };
    this.render();
  }

  render() {
    this.root.innerHTML = "";
    this.panel = document.createElement("section");
    this.panel.className = "museum-panel";
    this.panel.innerHTML = `
      <h1>Midnight Museum: The Awakening</h1>
      <div class="museum-grid">
        <div class="museum-row museum-section-row"><span class="museum-key">Controls</span><span class="museum-value"></span></div>
        <div class="museum-row"><span class="museum-key">W / S</span><span class="museum-value">Forward / Backward</span></div>
        <div class="museum-row"><span class="museum-key">A / D</span><span class="museum-value">Turn</span></div>
        <div class="museum-row"><span class="museum-key">C</span><span class="museum-value">Change Viewpoint</span></div>
        <div class="museum-row museum-section-row"><span class="museum-key">Status</span><span class="museum-value"></span></div>
        <div class="museum-row"><span class="museum-key">Camera</span><span data-field="camera" class="museum-value"></span></div>
        <div class="museum-row"><span class="museum-key">Lights</span><span data-field="lights" class="museum-value"></span></div>
      </div>
      <div class="museum-actions">
        <select class="museum-control" data-action="lightMode" aria-label="Lights">
          <option value="off">Secondary Lighting</option>
          <option value="day" selected>Main Lighting</option>
        </select>
        <button class="museum-control" data-action="shadows">Shadows</button>
        <select class="museum-control" data-action="quality" aria-label="Quality">
          <option value="low">Quality Low</option>
          <option value="medium" selected>Quality Medium</option>
          <option value="high">Quality High</option>
        </select>
      </div>
    `;
    this.root.appendChild(this.panel);
    this.panel.querySelector('[data-action="lightMode"]').addEventListener("change", event => this.dispatchEvent(new CustomEvent("lightModeChanged", { detail: event.target.value })));
    this.panel.querySelector('[data-action="shadows"]').addEventListener("click", () => this.dispatchEvent(new CustomEvent("toggleShadows")));
    this.panel.querySelector('[data-action="quality"]').addEventListener("change", event => this.dispatchEvent(new CustomEvent("qualityChanged", { detail: event.target.value })));
    this.refresh();
  }

  setCamera(label) {
    this.values.camera = label;
    this.refresh();
  }

  setLightMode(mode) {
    const labels = {
      off: "Secondary Lighting",
      day: "Main Lighting"
    };
    this.values.lights = labels[mode] ?? labels.day;
    this.panel.querySelector('[data-action="lightMode"]').value = mode;
    this.refresh();
  }

  setShadows(enabled) {
    this.values.shadows = enabled ? "on" : "off";
    this.panel.querySelector('[data-action="shadows"]').textContent = `Shadows ${this.values.shadows}`;
  }

  refresh() {
    this.panel.querySelector('[data-field="camera"]').textContent = this.values.camera;
    this.panel.querySelector('[data-field="lights"]').textContent = this.values.lights;
    this.panel.querySelector('[data-action="shadows"]').textContent = `Shadows ${this.values.shadows}`;
  }
}
