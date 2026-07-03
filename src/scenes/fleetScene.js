import { LabelConfig } from "../config/labelConfig.js";
import { FleetTestPlanetModelConfig, FleetTestPlanetViewConfig } from "../config/planetConfig.js";
import { FleetTestShipModelConfig, FleetTestShipViewConfig } from "../config/shipConfig.js";
import { createBody, createShip, setShipBatteryFromMapSize } from "../game/factory.js";
import { createWorld } from "../ecs/world.js";

export const FleetTestScene = Object.freeze({
  id: "FleetTest",
  label: LabelConfig.maps.FleetTest
});

export function createFleetTestScene() {
  const world = createWorld();
  let flagship;

  for (const planet of createFleetTestPlanets()) {
    createBody(world, planet);
  }

  for (const ship of createFleetTestShips()) {
    if (ship.fleetSlot === undefined) {
      flagship = createShip(world, ship);
      continue;
    }

    createShip(world, { ...ship, fleet: { flagship, slotIndex: ship.fleetSlot } });
  }

  setShipBatteryFromMapSize(world);
  return world;
}

function createFleetTestPlanets() {
  return FleetTestPlanetModelConfig.map((model) => {
    const view = FleetTestPlanetViewConfig.find((candidate) => candidate.id === model.id);
    if (!view) {
      throw new Error("Missing planet view config for " + model.id);
    }

    return { ...model, ...view };
  });
}

function createFleetTestShips() {
  return FleetTestShipModelConfig.map((model) => {
    const view = FleetTestShipViewConfig.find((candidate) => candidate.id === model.id);
    if (!view) {
      throw new Error("Missing ship view config for " + model.id);
    }

    return { ...model, ...view };
  });
}
