import * as THREE from "three";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function damp(current, target, lambda, deltaTime) {
  return lerp(current, target, 1 - Math.exp(-lambda * deltaTime));
}

export function distance2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function withinRect(position, rect) {
  return position.x >= rect.minX && position.x <= rect.maxX && position.z >= rect.minZ && position.z <= rect.maxZ;
}

export function angleTo(from, to) {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

export function normalizedDirection(x, z) {
  const vector = new THREE.Vector3(x, 0, z);
  if (vector.lengthSq() > 0) {
    vector.normalize();
  }
  return vector;
}
