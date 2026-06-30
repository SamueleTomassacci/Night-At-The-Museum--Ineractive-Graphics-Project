import * as THREE from "three";
import { ROOM_RECTS } from "../utils/constants.js";
import { withinRect, distance2D } from "../utils/math.js";
import { Clock } from "../exhibits/Clock.js";
import { Hall } from "./Hall.js";
import { DinosaurRoom } from "./DinosaurRoom.js";
import { StatueRoom } from "./StatueRoom.js";
import { EgyptianRoom } from "./EgyptianRoom.js";
import { GalleryRoom } from "./GalleryRoom.js";

export class Museum {
  constructor(factory, lightingSystem, sceneManager) {
    this.group = new THREE.Group();
    this.factory = factory;
    this.lightingSystem = lightingSystem;
    this.sceneManager = sceneManager;
    this.clock = new Clock(factory.materials, () => this.sceneManager.setAwakening());
    this.hall = new Hall(factory, this.clock);
    this.dinosaurRoom = new DinosaurRoom(factory);
    this.statueRoom = new StatueRoom(factory);
    this.egyptianRoom = new EgyptianRoom(factory, lightingSystem);
    this.galleryRoom = new GalleryRoom(factory);
    this.rooms = [this.hall, this.dinosaurRoom, this.statueRoom, this.egyptianRoom, this.galleryRoom];
    this.rooms.forEach(room => this.group.add(room.group));
    this.sceneManager.addEventListener("museumAwakens", () => {
      this.lightingSystem.setAwakening(true);
      this.dinosaurRoom.dinosaur.awaken();
    });
  }

  getAnimatables() {
    return [
      this.clock,
      this.dinosaurRoom.dinosaur,
      this.statueRoom.statue,
      this.egyptianRoom.sarcophagus,
      this.galleryRoom.paintings
    ];
  }

  getClickables() {
    return [
      this.egyptianRoom.sarcophagus,
      ...this.galleryRoom.paintings.getClickables()
    ];
  }

  getDoors() {
    return this.hall.getDoors();
  }

  updateTriggers(player) {
    const position = player.group.position;
    if (withinRect(position, ROOM_RECTS.dinosaur)) {
      this.dinosaurRoom.dinosaur.awaken(position);
    }
    const statueDistance = distance2D(position, this.statueRoom.statue.group.position);
    if (statueDistance < 5.2) {
      this.statueRoom.statue.awaken(position);
    }
    this.galleryRoom.paintings.updateReactions(position);
    this.lightingSystem.boostEgyptianTorches(withinRect(position, ROOM_RECTS.egyptian));
  }
}
