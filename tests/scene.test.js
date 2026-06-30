import assert from "node:assert/strict";
import test from "node:test";
import { BodyKind, Component } from "../src/ecs/components.js";
import { getComponents } from "../src/ecs/world.js";
import { createStarterScene } from "../src/scenes/starterScene.js";

test("starter scene uses render-only sunlight instead of a sun entity", () => {
  const world = createStarterScene();
  const kinds = [...getComponents(world, Component.BodyKind).values()].map((kind) => kind.value);

  assert.equal(kinds.includes("star"), false);
  assert.equal(kinds.includes(BodyKind.Planet), true);
  assert.equal(kinds.includes(BodyKind.ResourcePlanet), true);
  assert.equal(kinds.includes(BodyKind.Station), true);
  assert.equal(kinds.includes(BodyKind.Ship), true);
});
