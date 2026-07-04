import { LabelConfig } from "../config/labelConfig.js";
import { SpaceMapModelConfig } from "../config/spaceMapConfig.js";
import { FleetBattleShipModelConfig, FleetBattleShipViewConfig } from "../config/shipConfig.js";
import { deriveRegionSeed } from "../core/random.js";
import { Component, FactionId } from "../ecs/components.js";
import { addComponent, createWorld } from "../ecs/world.js";
import { generateBattleMap } from "../game/battleMap.js";
import { createBody, createShip, setShipBatteryFromMapSize } from "../game/factory.js";

export const BattleScene = Object.freeze({
  id: "Battle",
  label: LabelConfig.maps.Battle
});

export function createBattleScene(context) {
  const seed = context?.battleRegion?.seed ?? deriveRegionSeed(SpaceMapModelConfig.seed, 0);
  const battleMap = generateBattleMap(seed);
  const world = createWorld();
  world.battleMap = battleMap;

  for (const planet of battleMap.planets) {
    createBody(world, planet);
  }

  createPlayerFleet(world);
  createEnemyFleet(world, battleMap);

  setShipBatteryFromMapSize(world);
  return world;
}

function createPlayerFleet(world) {
  let flagship;

  for (const model of FleetBattleShipModelConfig) {
    if (model.faction !== FactionId.Player) {
      continue;
    }
    const view = FleetBattleShipViewConfig.find((candidate) => candidate.id === model.id);
    if (!view) {
      throw new Error("Missing ship view config for " + model.id);
    }

    const ship = { ...model, ...view };
    if (ship.playerControlled) {
      flagship = createShip(world, ship);
      continue;
    }
    createShip(world, { ...ship, fleet: { flagship, slotIndex: ship.fleetSlot } });
  }

  return flagship;
}

function createEnemyFleet(world, battleMap) {
  let flagship;

  for (const ship of battleMap.enemyShips) {
    if (ship.fleetSlot === undefined) {
      flagship = createShip(world, ship);
      addComponent(world, flagship, Component.Fleet, {
        formationHeading: ship.rotation,
        formation: battleMap.enemyFormation
      });
      continue;
    }
    createShip(world, { ...ship, fleet: { flagship, slotIndex: ship.fleetSlot } });
  }

  return flagship;
}
