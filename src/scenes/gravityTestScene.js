import { LabelConfig } from "../config/labelConfig.js";
import { GravityTestPlanetModelConfig, GravityTestPlanetViewConfig } from "../config/planetConfig.js";
import { GravityTestShipModelConfig, GravityTestShipViewConfig } from "../config/shipConfig.js";
import { createBody, createShip, setShipBatteryFromMapSize } from "../game/factory.js";
import { createWorld } from "../ecs/world.js";

export const GravityTestScene = Object.freeze({
  id: "GravityTest",
  label: LabelConfig.maps.GravityTest
});

export function createGravityTestScene() {
  const world = createWorld();

  for (const planet of createGravityTestPlanets()) {
    createBody(world, planet);
  }

  for (const ship of createGravityTestShips()) {
    createShip(world, ship);
  }

  setShipBatteryFromMapSize(world);
  return world;
}

function createGravityTestPlanets() {
  return GravityTestPlanetModelConfig.map((model) => {
    const view = GravityTestPlanetViewConfig.find((candidate) => candidate.id === model.id);
    if (!view) {
      throw new Error("Missing planet view config for " + model.id);
    }

    return { ...model, ...view };
  });
}

function createGravityTestShips() {
  return GravityTestShipModelConfig.map((model) => {
    const view = GravityTestShipViewConfig.find((candidate) => candidate.id === model.id);
    if (!view) {
      throw new Error("Missing ship view config for " + model.id);
    }

    return { ...model, ...view };
  });
}
