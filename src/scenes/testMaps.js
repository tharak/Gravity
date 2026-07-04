import { BattleScene, createBattleScene } from "./battleScene.js";
import { createFleetBattleScene, FleetBattleScene } from "./fleetBattleScene.js";
import { createFleetTestScene, FleetTestScene } from "./fleetScene.js";
import { createGravityTestScene, GravityTestScene } from "./gravityTestScene.js";
import { createLevelSelectScene, LevelSelectScene } from "./levelSelectScene.js";
import { createShipMovementScene, ShipMovementScene } from "./shipMovementScene.js";
import { createSpaceMapScene, SpaceMapScene } from "./spaceMapScene.js";

export const TestMapId = Object.freeze({
  SpaceMap: SpaceMapScene.id,
  LevelSelect: LevelSelectScene.id,
  ShipMovement: ShipMovementScene.id,
  GravityTest: GravityTestScene.id,
  FleetTest: FleetTestScene.id,
  FleetBattle: FleetBattleScene.id,
  Battle: BattleScene.id
});

export const testMaps = Object.freeze([
  Object.freeze({ ...SpaceMapScene, createWorld: createSpaceMapScene }),
  Object.freeze({ ...LevelSelectScene, createWorld: createLevelSelectScene }),
  Object.freeze({ ...ShipMovementScene, createWorld: createShipMovementScene }),
  Object.freeze({ ...GravityTestScene, createWorld: createGravityTestScene }),
  Object.freeze({ ...FleetTestScene, createWorld: createFleetTestScene }),
  Object.freeze({ ...FleetBattleScene, createWorld: createFleetBattleScene }),
  Object.freeze({ ...BattleScene, createWorld: createBattleScene })
]);

export function getTestMap(mapId) {
  return testMaps.find((map) => map.id === mapId) ?? testMaps[0];
}
