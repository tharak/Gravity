import { LabelConfig } from "../config/labelConfig.js";
import { BodyKind } from "../ecs/components.js";
import { createBody, createShip } from "../game/factory.js";
import { createWorld } from "../ecs/world.js";

export const GravityTestScene = Object.freeze({
  id: "GravityTest",
  label: LabelConfig.maps.GravityTest
});

export function createGravityTestScene() {
  const world = createWorld();

  createBody(world, {
    kind: BodyKind.ResourcePlanet,
    x: -280,
    y: -150,
    mass: 900,
    radius: 48,
    resources: { minerals: 1200 },
    static: true
  });
  createBody(world, {
    kind: BodyKind.Planet,
    x: 230,
    y: -120,
    mass: 700,
    radius: 42,
    static: true
  });
  createBody(world, {
    kind: BodyKind.Planet,
    x: 20,
    y: 190,
    mass: 520,
    radius: 36,
    static: true
  });

  createShip(world, {
    x: -80,
    y: 35,
    vx: 0,
    vy: 0,
    mass: 2,
    radius: 52,
    playerControlled: "player-one",
    thrusterAcceleration: 15,
    shipFrame: { width: 94, height: 46 }
  });
  createShip(world, {
    x: 130,
    y: 40,
    vx: -4,
    vy: 2,
    mass: 2,
    radius: 50,
    rotation: -0.35,
    thrusterAcceleration: 12
  });
  createShip(world, {
    x: -180,
    y: 150,
    vx: 3,
    vy: -2,
    mass: 2,
    radius: 50,
    rotation: 0.65,
    thrusterAcceleration: 12
  });

  return world;
}
