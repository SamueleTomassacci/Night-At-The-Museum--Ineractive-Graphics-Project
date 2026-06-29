import { MUSEUM_BOUNDS } from "../utils/constants.js";
import { clamp } from "../utils/math.js";

export class CollisionSystem {
  constructor(bounds = MUSEUM_BOUNDS) {
    this.bounds = bounds;
  }

  constrain(position, radius = 0.45) {
    position.x = clamp(position.x, this.bounds.minX + radius, this.bounds.maxX - radius);
    position.z = clamp(position.z, this.bounds.minZ + radius, this.bounds.maxZ - radius);
  }
}
