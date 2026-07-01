import assert from "node:assert/strict";
import test from "node:test";
import { BodyKind, Component } from "../src/ecs/components.js";
import { getComponents } from "../src/ecs/world.js";
import { createStarterScene } from "../src/scenes/starterScene.js";

test("starter scene is a single-ship thruster debug map", () => {
  const world = createStarterScene();
  const kinds = [...getComponents(world, Component.BodyKind).values()].map((kind) => kind.value);
  const thrusters = getComponents(world, Component.Thruster);

  assert.deepEqual(kinds, [BodyKind.Ship]);
  assert.equal(thrusters.size, 7);
  assert.equal(getComponents(world, Component.ShipFrame).size, 1);
  assert.equal(getComponents(world, Component.Rotation).size, 1);
  assert.equal(getComponents(world, Component.AngularVelocity).size, 1);
  assert.equal(getComponents(world, Component.AngularAcceleration).size, 1);
  assert.equal(getComponents(world, Component.MomentOfInertia).size, 1);
  assert.equal(getComponents(world, Component.Battery).size, 1);
  assert.equal(getComponents(world, Component.Parent).size, 7);
});
