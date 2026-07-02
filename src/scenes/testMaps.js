import { createGravityTestScene, GravityTestScene } from "./gravityTestScene.js";
import { createLevelSelectScene, LevelSelectScene } from "./levelSelectScene.js";
import { createShipMovementScene, ShipMovementScene } from "./shipMovementScene.js";

export const TestMapId = Object.freeze({
  LevelSelect: LevelSelectScene.id,
  ShipMovement: ShipMovementScene.id,
  GravityTest: GravityTestScene.id
});

export const testMaps = Object.freeze([
  Object.freeze({ ...LevelSelectScene, createWorld: createLevelSelectScene }),
  Object.freeze({ ...ShipMovementScene, createWorld: createShipMovementScene }),
  Object.freeze({ ...GravityTestScene, createWorld: createGravityTestScene })
]);

export const playableTestMaps = Object.freeze(testMaps.filter((map) => !map.isMenu));

export function getTestMap(mapId) {
  return testMaps.find((map) => map.id === mapId) ?? testMaps[0];
}
