import * as TWEEN from "@tweenjs/tween.js";
import { Renderer } from "./core/Renderer.js";
import { SceneManager } from "./core/SceneManager.js";
import { CameraManager } from "./core/CameraManager.js";
import { InputManager } from "./core/InputManager.js";
import { InteractionManager } from "./core/InteractionManager.js";
import { AssetFactory } from "./core/AssetFactory.js";
import { createMaterials } from "./utils/materials.js";
import { Player } from "./characters/Player.js";
import { Museum } from "./world/Museum.js";
import { AnimationSystem } from "./systems/AnimationSystem.js";
import { LightingSystem } from "./systems/LightingSystem.js";
import { CollisionSystem } from "./systems/CollisionSystem.js";
import { UIController } from "./systems/UIController.js";

const renderer = new Renderer();
const sceneManager = new SceneManager();
const cameraManager = new CameraManager();
const inputManager = new InputManager(renderer.renderer.domElement);
const materials = createMaterials();
const factory = new AssetFactory(materials);
const lightingSystem = new LightingSystem(sceneManager.scene);
const collisionSystem = new CollisionSystem();
const animationSystem = new AnimationSystem();
const museum = new Museum(factory, lightingSystem, sceneManager);
const player = new Player(materials, inputManager, collisionSystem);
const interactionManager = new InteractionManager(cameraManager.camera, inputManager);
const ui = new UIController(document.getElementById("ui-root"));

sceneManager.scene.add(museum.group, player.group);
animationSystem.addMany([lightingSystem, ...museum.getAnimatables()]);
museum.getClickables().forEach(clickable => interactionManager.register(clickable.group, clickable));

let shadowsEnabled = true;
let lastTime = performance.now();

inputManager.addEventListener("keyPressed", event => {
  if (event.detail === "c") {
    cameraManager.cycleMode();
    ui.setCamera(cameraManager.getLabel());
  }
  if (event.detail === "l") {
    ui.setLights(lightingSystem.toggle());
  }
});

ui.addEventListener("toggleLights", () => {
  ui.setLights(lightingSystem.toggle());
});

ui.addEventListener("toggleShadows", () => {
  shadowsEnabled = !shadowsEnabled;
  renderer.setShadows(shadowsEnabled);
  ui.setShadows(shadowsEnabled);
});

ui.addEventListener("qualityChanged", event => {
  renderer.setQuality(event.detail);
  shadowsEnabled = renderer.renderer.shadowMap.enabled;
  ui.setShadows(shadowsEnabled);
});

sceneManager.addEventListener("museumAwakens", () => {
  ui.setMuseumState(sceneManager.state);
});

window.addEventListener("resize", () => renderer.resize(cameraManager.camera));

function loop(time) {
  requestAnimationFrame(loop);
  const deltaTime = Math.min(0.05, (time - lastTime) / 1000);
  const elapsedTime = time / 1000;
  lastTime = time;
  TWEEN.update(time);
  player.update(deltaTime, elapsedTime);
  museum.updateTriggers(player);
  animationSystem.update(deltaTime, elapsedTime);
  cameraManager.update(player, deltaTime, elapsedTime);
  renderer.render(sceneManager.scene, cameraManager.camera);
}

ui.setCamera(cameraManager.getLabel());
ui.setLights(lightingSystem.enabled);
ui.setShadows(shadowsEnabled);
requestAnimationFrame(loop);
