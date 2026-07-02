import { createWorld } from "../ecs/world.js";
import { seedStarterSystem } from "../game/factory.js";

export const ShipMovementScene = Object.freeze({
  id: "ShipMovement",
  label: "Ship Movement"
});

export function createShipMovementScene() {
  const world = createWorld();
  seedStarterSystem(world);
  return world;
}
