import { LabelConfig } from "../config/labelConfig.js";
import { FleetBattlePlanetModelConfig, FleetBattlePlanetViewConfig } from "../config/planetConfig.js";
import { FleetBattleShipModelConfig, FleetBattleShipViewConfig } from "../config/shipConfig.js";
import { createBody, createShip, setShipBatteryFromMapSize } from "../game/factory.js";
import { createWorld } from "../ecs/world.js";

export const FleetBattleScene = Object.freeze({
  id: "FleetBattle",
  label: LabelConfig.maps.FleetBattle
});

export function createFleetBattleScene() {
  const world = createWorld();
  let flagship;

  for (const planet of createFleetBattlePlanets()) {
    createBody(world, planet);
  }

  for (const ship of createFleetBattleShips()) {
    if (ship.playerControlled) {
      flagship = createShip(world, ship);
      continue;
    }

    if (ship.fleetSlot !== undefined) {
      createShip(world, { ...ship, fleet: { flagship, slotIndex: ship.fleetSlot } });
      continue;
    }

    createShip(world, ship);
  }

  setShipBatteryFromMapSize(world);
  return world;
}

function createFleetBattlePlanets() {
  return FleetBattlePlanetModelConfig.map((model) => {
    const view = FleetBattlePlanetViewConfig.find((candidate) => candidate.id === model.id);
    if (!view) {
      throw new Error("Missing planet view config for " + model.id);
    }

    return { ...model, ...view };
  });
}

function createFleetBattleShips() {
  return FleetBattleShipModelConfig.map((model) => {
    const view = FleetBattleShipViewConfig.find((candidate) => candidate.id === model.id);
    if (!view) {
      throw new Error("Missing ship view config for " + model.id);
    }

    return { ...model, ...view };
  });
}
