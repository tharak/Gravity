import { createWorld } from "../ecs/world.js";
import { seedStarterSystem } from "../game/factory.js";

export function createStarterScene() {
  const world = createWorld();
  seedStarterSystem(world);
  return world;
}
