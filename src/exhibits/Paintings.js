import * as THREE from "three";
import { distance2D } from "../utils/math.js";

const PAINTING_IMAGE_URLS = [
  new URL("../images/van_gogh_1.jpg", import.meta.url).href,
  new URL("../images/van_gogh_2.jpeg", import.meta.url).href,
  new URL("../images/seraut.jpg", import.meta.url).href,
  new URL("../images/picasso.jpg", import.meta.url).href,
  new URL("../images/monet.jpg", import.meta.url).href,
  new URL("../images/daVinci.jpeg", import.meta.url).href,
  new URL("../images/botticelli.jpg", import.meta.url).href
];
const PAINTING_ASPECT =1.8 / 1.22;
const PAINTING_PROMPT_DISTANCE = 4.2;

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

function loadPaintingTexture(url) {
  if (!textureCache.has(url)) {
    const texture = textureLoader.load(url, loadedTexture => {
      fitTextureToPainting(loadedTexture);
      loadedTexture.needsUpdate = true;
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(url, texture);
  }

  return textureCache.get(url);
}

function fitTextureToPainting(texture) {
  const image = texture.image;
  if (!image?.width || !image?.height) {
    return;
  }

  const imageAspect = image.width / image.height;
  texture.offset.set(0, 0);
  texture.repeat.set(1,1);

  if (imageAspect > PAINTING_ASPECT) {
    texture.repeat.x = PAINTING_ASPECT / imageAspect;
    texture.offset.x = (1 - texture.repeat.x)/ 2;
  } else {
    texture.repeat.y = imageAspect/ PAINTING_ASPECT;
    texture.offset.y = (1 - texture.repeat.y) / 2;
  }
}

class Painting {
  constructor(materials,index, position, rotationY, textureIndex, onRequestTextureChange) {
    this.materials = materials;
    this.index = index;
    this.textureIndex = textureIndex;
    this.onRequestTextureChange = onRequestTextureChange;
    this.group = new THREE.Group();
    this.group.position.set(position[0], position[1], position[2]);
    this.group.rotation.y = rotationY;
    this.reactive = false;
    this.createModel();
  }

  createModel() {
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(2.25,0.18, 0.18), this.materials.wood);
    const bottomFrame = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.18, 0.18), this.materials.wood);
    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.65, 0.18), this.materials.wood);
    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.65, 0.18), this.materials.wood);

    topFrame.position.y = 0.735;
    bottomFrame.position.y = -0.735;
    leftFrame.position.x = -1.035;
    rightFrame.position.x = 1.035;

    const artMaterial = new THREE.MeshStandardMaterial({
      map: this.getTexture(),
      roughness: 0.34,
      metalness: 0.04,
      emissive: 0x000000,
      side: THREE.DoubleSide
    });
    this.surface = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.22), artMaterial);
    this.surface.position.z = -0.12;

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.3), this.materials.glass);
    glass.position.z = -0.17;
    this.group.add(topFrame,bottomFrame, leftFrame, rightFrame, this.surface, glass);
    this.group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  getTexture() {
    return loadPaintingTexture(PAINTING_IMAGE_URLS[this.textureIndex]);
  }

  setTextureIndex(textureIndex) {
    this.textureIndex = textureIndex;
    this.surface.material.map = this.getTexture();
    this.surface.material.needsUpdate = true;
  }

  onClick() {
    this.onRequestTextureChange(this);
  }

  react(strength) {
    this.reactive = strength > 0;
    this.surface.material.emissive.setHex(this.reactive ? 0x222244 : 0x000000);
    this.surface.material.emissiveIntensity = strength*0.9;
  }

  update(deltaTime, elapsedTime) {
    const target = this.reactive ? Math.sin(elapsedTime *5 + this.index) * 0.08 : 0;
    this.group.rotation.z += (target - this.group.rotation.z) * Math.min(1, deltaTime * 7);
  }
}

export class Paintings {
  constructor(materials) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.nextTextureCursor = 4;
    this.prompt = this.createPrompt();
    this.paintings = [
      new Painting(materials, 0, [-2.4, 2.3, 22.68], 0, 0, painting => this.changePaintingTexture(painting)),
      new Painting(materials, 1, [2.4, 2.3, 22.68], 0, 1, painting => this.changePaintingTexture(painting)),
      new Painting(materials, 2, [-7.68, 2.3, 15.2], Math.PI * 0.5, 2, painting => this.changePaintingTexture(painting)),
      new Painting(materials, 3, [7.68, 2.3, 15.2], -Math.PI * 0.5, 3, painting => this.changePaintingTexture(painting))
    ];
    this.paintings.forEach(painting => {
      this.group.add(painting.group);
    });
  }

  createPrompt() {
    const prompt = document.createElement("div");
    prompt.textContent = "Click the painting to change the artwork";
    prompt.style.position = "fixed";
    prompt.style.left = "50%";
    prompt.style.bottom = "72px";
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

  changePaintingTexture(selectedPainting) {
    const usedByOtherPaintings = new Set(
      this.paintings
        .filter(painting => painting !== selectedPainting)
        .map(painting => painting.textureIndex)
    );

    for (let i = 0; i < PAINTING_IMAGE_URLS.length; i += 1) {
      const candidate = (this.nextTextureCursor +i) % PAINTING_IMAGE_URLS.length;
      if (!usedByOtherPaintings.has(candidate) && candidate !== selectedPainting.textureIndex) {
        selectedPainting.setTextureIndex(candidate);
        this.nextTextureCursor = (candidate + 1) % PAINTING_IMAGE_URLS.length;
        return;
      }
    }
  }

  getClickables() {
    return this.paintings;
  }

  updateReactions(playerPosition) {
    let nearest = null;
    let nearestDistance = Infinity;
    this.paintings.forEach(painting => {
      const world = new THREE.Vector3();
      painting.group.getWorldPosition(world);
      const distance = distance2D(playerPosition, world);
      if (distance < nearestDistance) {
        nearest = painting;
        nearestDistance = distance;
      }
    });

    this.paintings.forEach(painting => {
      painting.react(painting === nearest && nearestDistance < 5 ? 1-nearestDistance / 5 : 0);
    });
    this.prompt.style.display = nearestDistance < PAINTING_PROMPT_DISTANCE ? "block" : "none";
  }

  update(deltaTime, elapsedTime) {
    this.paintings.forEach(painting => {
      painting.update(deltaTime,elapsedTime);
    });
  }
}
