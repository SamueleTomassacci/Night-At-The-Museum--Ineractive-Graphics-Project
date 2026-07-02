import * as THREE from "three";
import { COLORS } from "./constants.js";
import { createFloorTexture, createNormalTexture, createObeliskTexture, createSarcophagusTexture, createWallTexture, createWoodTexture } from "./proceduralTextures.js";

const USE_EXTERNAL_FLOOR_TEXTURES = true;
const FLOOR_TEXTURE_REPEAT = { x: 8, y: 8 };
const FLOOR_TEXTURE_PATHS = {
  color: "/texture/floor/WoodFloor064_2K-JPG_Color.jpg",
  normal: "/texture/floor/WoodFloor064_2K-JPG_NormalGL.jpg",
  roughness: "/texture/floor/WoodFloor064_2K-JPG_Roughness.jpg"
};
const USE_EXTERNAL_WALL_TEXTURES = true;
const WALL_TEXTURE_REPEAT = { x: 3, y: 2 };
const WALL_TEXTURE_PATHS = {
  color: "/texture/wall/Concrete030_2K-JPG_Color.jpg",
  normal: "/texture/wall/Concrete030_2K-JPG_NormalGL.jpg",
  roughness: "/texture/wall/Concrete030_2K-JPG_Roughness.jpg"
};
const CEILING_TEXTURE_REPEAT = { x: 5, y: 5 };
const CEILING_TEXTURE_PATHS = {
  color: "/texture/ceiling/wooden_panels_diff_4k.jpg",
  bump: "/texture/ceiling/wooden_panels_disp_4k%20(1).png"
};

function configureFloorTexture(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(FLOOR_TEXTURE_REPEAT.x, FLOOR_TEXTURE_REPEAT.y);
  return texture;
}

function configureWallTexture(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(WALL_TEXTURE_REPEAT.x, WALL_TEXTURE_REPEAT.y);
  return texture;
}

function configureCeilingTexture(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(CEILING_TEXTURE_REPEAT.x, CEILING_TEXTURE_REPEAT.y);
  return texture;
}

function createProceduralFloorMaterial(floorTexture = createFloorTexture(), floorNormal = createNormalTexture()) {
  return new THREE.MeshStandardMaterial({
    map: floorTexture,
    normalMap: floorNormal,
    roughness: 0.28,
    metalness: 0.18,
    color: 0xdce5ff
  });
}

function createProceduralWallMaterial(wallTexture = createWallTexture()) {
  return new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.72,
    metalness: 0.02,
    color: COLORS.wall
  });
}

function createExternalFloorMaterial(fallbackTexture, fallbackNormal) {
  const textureLoader = new THREE.TextureLoader();
  const material = new THREE.MeshStandardMaterial({
    map: null,
    normalMap: null,
    roughnessMap: null,
    roughness: 0.85,
    metalness: 0.0
  });

  let fallbackApplied = false;
  const applyFallback = () => {
    if (fallbackApplied) {
      return;
    }

    fallbackApplied = true;
    material.map = fallbackTexture;
    material.normalMap = fallbackNormal;
    material.roughnessMap = null;
    material.roughness = 0.28;
    material.metalness = 0.18;
    material.color.setHex(0xdce5ff);
    material.needsUpdate = true;
  };

  const colorTexture = configureFloorTexture(textureLoader.load(FLOOR_TEXTURE_PATHS.color, undefined, undefined, applyFallback));
  colorTexture.colorSpace = THREE.SRGBColorSpace;

  const normalTexture = configureFloorTexture(textureLoader.load(FLOOR_TEXTURE_PATHS.normal, undefined, undefined, applyFallback));
  const roughnessTexture = configureFloorTexture(textureLoader.load(FLOOR_TEXTURE_PATHS.roughness, undefined, undefined, applyFallback));

  material.map = colorTexture;
  material.normalMap = normalTexture;
  material.roughnessMap = roughnessTexture;

  return material;
}

function createExternalWallMaterial(fallbackTexture) {
  const textureLoader = new THREE.TextureLoader();
  const material = new THREE.MeshStandardMaterial({
    map: null,
    normalMap: null,
    roughnessMap: null,
    roughness: 0.82,
    metalness: 0.0
  });

  let fallbackApplied = false;
  const applyFallback = () => {
    if (fallbackApplied) {
      return;
    }

    fallbackApplied = true;
    material.map = fallbackTexture;
    material.normalMap = null;
    material.roughnessMap = null;
    material.roughness = 0.72;
    material.metalness = 0.02;
    material.color.setHex(COLORS.wall);
    material.needsUpdate = true;
  };

  const colorTexture = configureWallTexture(textureLoader.load(WALL_TEXTURE_PATHS.color, undefined, undefined, applyFallback));
  colorTexture.colorSpace = THREE.SRGBColorSpace;

  const normalTexture = configureWallTexture(textureLoader.load(WALL_TEXTURE_PATHS.normal, undefined, undefined, applyFallback));
  const roughnessTexture = configureWallTexture(textureLoader.load(WALL_TEXTURE_PATHS.roughness, undefined, undefined, applyFallback));

  material.map = colorTexture;
  material.normalMap = normalTexture;
  material.roughnessMap = roughnessTexture;

  return material;
}

function createCeilingMaterial() {
  const textureLoader = new THREE.TextureLoader();
  const colorTexture = configureCeilingTexture(textureLoader.load(CEILING_TEXTURE_PATHS.color));
  const bumpTexture = configureCeilingTexture(textureLoader.load(CEILING_TEXTURE_PATHS.bump));
  colorTexture.colorSpace = THREE.SRGBColorSpace;

  return new THREE.MeshStandardMaterial({
    map: colorTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.035,
    roughness: 0.64,
    metalness: 0.04,
    side: THREE.DoubleSide
  });
}

export function createMaterials({ useExternalFloorTextures = USE_EXTERNAL_FLOOR_TEXTURES, useExternalWallTextures = USE_EXTERNAL_WALL_TEXTURES } = {}) {
  const floorFallbackTexture = createFloorTexture();
  const floorFallbackNormal = createNormalTexture();
  const wallFallbackTexture = createWallTexture();
  const woodTexture = createWoodTexture();
  const sarcophagusTexture = createSarcophagusTexture();
  const obeliskTexture = createObeliskTexture();
  const floorMaterial = useExternalFloorTextures
    ? createExternalFloorMaterial(floorFallbackTexture, floorFallbackNormal)
    : createProceduralFloorMaterial(floorFallbackTexture, floorFallbackNormal);
  const wallMaterial = useExternalWallTextures
    ? createExternalWallMaterial(wallFallbackTexture)
    : createProceduralWallMaterial(wallFallbackTexture);

  return {
    floor: floorMaterial,
    wall: wallMaterial,
    ceiling: createCeilingMaterial(),
    trim: new THREE.MeshStandardMaterial({ color: COLORS.trim, roughness: 0.58 }),
    wood: new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.48, metalness: 0.04 }),
    bone: new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.42, metalness: 0.02 }),
    darkBone: new THREE.MeshStandardMaterial({ color: 0xb7ac91, roughness: 0.5 }),
    statue: new THREE.MeshStandardMaterial({ color: COLORS.statue, roughness: 0.38, metalness: 0.05 }),
    gold: new THREE.MeshStandardMaterial({ color: COLORS.gold, roughness: 0.28, metalness: 0.28 }),
    sarcophagus: new THREE.MeshStandardMaterial({ map: sarcophagusTexture, roughness: 0.32, metalness: 0.14 }),
    obelisk: new THREE.MeshStandardMaterial({ map: obeliskTexture, roughness: 0.54, metalness: 0.05 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xbfd8ff, roughness: 0.04, metalness: 0, transmission: 0.18, transparent: true, opacity: 0.34, side: THREE.DoubleSide }),
    playerCoat: new THREE.MeshStandardMaterial({ color: 0x253153, roughness: 0.64 }),
    playerSkin: new THREE.MeshStandardMaterial({ color: 0xe2b58b, roughness: 0.56 }),
    sign: new THREE.MeshStandardMaterial({ color: 0x151b2e, roughness: 0.5 }),
    signText: new THREE.MeshBasicMaterial({ color: 0xffe1a3 })
  };
}
