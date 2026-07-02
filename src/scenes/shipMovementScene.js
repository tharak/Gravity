import { LabelConfig } from "../config/labelConfig.js";
import { createWorld } from "../ecs/world.js";
import { seedStarterSystem, setShipBatteryFromMapSize } from "../game/factory.js";

export const ShipMovementScene = Object.freeze({
  id: "ShipMovement",
  label: LabelConfig.maps.ShipMovement
});

export function createShipMovementScene() {
  const world = createWorld();
  seedStarterSystem(world);
  setShipBatteryFromMapSize(world);
  return world;
}
