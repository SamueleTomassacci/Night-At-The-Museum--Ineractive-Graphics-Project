import * as THREE from "three";
import { COLORS } from "./constants.js";
import { createFloorTexture, createNormalTexture, createSarcophagusTexture, createWallTexture, createWoodTexture } from "./proceduralTextures.js";

export function createMaterials() {
  const floorTexture = createFloorTexture();
  const floorNormal = createNormalTexture();
  const wallTexture = createWallTexture();
  const woodTexture = createWoodTexture();
  const sarcophagusTexture = createSarcophagusTexture();

  return {
    floor: new THREE.MeshStandardMaterial({
      map: floorTexture,
      normalMap: floorNormal,
      roughness: 0.28,
      metalness: 0.18,
      color: 0xdce5ff
    }),
    wall: new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.72,
      metalness: 0.02,
      color: COLORS.wall
    }),
    trim: new THREE.MeshStandardMaterial({ color: COLORS.trim, roughness: 0.58 }),
    wood: new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.48, metalness: 0.04 }),
    bone: new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.42, metalness: 0.02 }),
    darkBone: new THREE.MeshStandardMaterial({ color: 0xb7ac91, roughness: 0.5 }),
    statue: new THREE.MeshStandardMaterial({ color: COLORS.statue, roughness: 0.38, metalness: 0.05 }),
    gold: new THREE.MeshStandardMaterial({ color: COLORS.gold, roughness: 0.28, metalness: 0.28 }),
    sarcophagus: new THREE.MeshStandardMaterial({ map: sarcophagusTexture, roughness: 0.32, metalness: 0.14 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xbfd8ff, roughness: 0.04, metalness: 0, transmission: 0.18, transparent: true, opacity: 0.34, side: THREE.DoubleSide }),
    playerCoat: new THREE.MeshStandardMaterial({ color: 0x253153, roughness: 0.64 }),
    playerSkin: new THREE.MeshStandardMaterial({ color: 0xe2b58b, roughness: 0.56 }),
    sign: new THREE.MeshStandardMaterial({ color: 0x151b2e, roughness: 0.5 }),
    signText: new THREE.MeshBasicMaterial({ color: 0xffe1a3 })
  };
}
