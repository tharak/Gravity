import assert from "node:assert/strict";
import test from "node:test";
import { BodyKind, Component } from "../src/ecs/components.js";
import { getComponents } from "../src/ecs/world.js";
import { createStarterScene } from "../src/scenes/starterScene.js";

test("starter scene is a multi-ship thruster debug map", () => {
  const world = createStarterScene();
  const kinds = [...getComponents(world, Component.BodyKind).values()].map((kind) => kind.value);
  const thrusters = getComponents(world, Component.Thruster);

  assert.deepEqual(kinds, [BodyKind.Ship, BodyKind.Ship, BodyKind.Ship, BodyKind.Ship, BodyKind.Ship]);
  assert.equal(thrusters.size, 35);
  assert.equal(getComponents(world, Component.ShipFrame).size, 5);
  assert.equal(getComponents(world, Component.Rotation).size, 5);
});
