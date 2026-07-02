import assert from "node:assert/strict";
import test from "node:test";
import { BodyKind, Component } from "../src/ecs/components.js";
import { getComponent, getComponents } from "../src/ecs/world.js";
import { createGravityTestScene } from "../src/scenes/gravityTestScene.js";
import { createStarterScene } from "../src/scenes/starterScene.js";
import { getTestMap, TestMapId, testMaps } from "../src/scenes/testMaps.js";

test("ShipMovement map is a single-ship thruster debug map", () => {
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

  const mainThruster = [...thrusters.entries()]
    .map(([entity]) => getComponent(world, entity, Component.Thruster))
    .find((thruster) => thruster.number === 1);
  assert.equal(mainThruster.maxAcceleration, 150);
});

test("GravityTest map has static planets and multiple ships", () => {
  const world = createGravityTestScene();
  const kinds = [...getComponents(world, Component.BodyKind).values()].map((kind) => kind.value);

  assert.equal(kinds.filter((kind) => kind === BodyKind.Ship).length, 3);
  assert.equal(kinds.filter((kind) => kind === BodyKind.Planet).length, 2);
  assert.equal(kinds.filter((kind) => kind === BodyKind.ResourcePlanet).length, 1);
  assert.equal(getComponents(world, Component.StaticBody).size, 3);
  assert.equal(getComponents(world, Component.PlayerControlled).size, 1);
  assert.equal(getComponents(world, Component.Thruster).size, 21);
});

test("test maps are selectable by stable ids", () => {
  assert.deepEqual(testMaps.map((map) => map.id), [TestMapId.ShipMovement, TestMapId.GravityTest]);
  assert.equal(getTestMap(TestMapId.ShipMovement).id, "ShipMovement");
  assert.equal(getTestMap(TestMapId.GravityTest).id, "GravityTest");
  assert.equal(getTestMap("missing").id, "ShipMovement");
});
