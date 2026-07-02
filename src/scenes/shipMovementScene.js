import { LabelConfig } from "../config/labelConfig.js";
import { createWorld } from "../ecs/world.js";
import { seedStarterSystem, setShipFuelFromMapSize } from "../game/factory.js";

export const ShipMovementScene = Object.freeze({
  id: "ShipMovement",
  label: LabelConfig.maps.ShipMovement
});

export function createShipMovementScene() {
  const world = createWorld();
  seedStarterSystem(world);
  setShipFuelFromMapSize(world);
  return world;
}
