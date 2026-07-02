import { createGravityTestScene, GravityTestScene } from "./gravityTestScene.js";
import { createShipMovementScene, ShipMovementScene } from "./shipMovementScene.js";

export const TestMapId = Object.freeze({
  ShipMovement: ShipMovementScene.id,
  GravityTest: GravityTestScene.id
});

export const testMaps = Object.freeze([
  Object.freeze({ ...ShipMovementScene, createWorld: createShipMovementScene }),
  Object.freeze({ ...GravityTestScene, createWorld: createGravityTestScene })
]);

export function getTestMap(mapId) {
  return testMaps.find((map) => map.id === mapId) ?? testMaps[0];
}
