import assert from "node:assert/strict";
import test from "node:test";
import { BodyKind, Component, FactionId } from "../src/ecs/components.js";
import { getComponent, getComponents } from "../src/ecs/world.js";
import { applyWorldBoundary } from "../src/systems/boundarySystem.js";
import { removeDestroyedShips } from "../src/systems/destructionSystem.js";
import { createBattleScene } from "../src/scenes/battleScene.js";

test("battle worlds define an arena around every spawned body", () => {
  const world = createBattleScene();

  assert.equal(Object.isFrozen(world.arena), true);
  for (const [, position] of getComponents(world, Component.Position)) {
    assert.equal(position.x >= world.arena.minX && position.x <= world.arena.maxX, true);
    assert.equal(position.y >= world.arena.minY && position.y <= world.arena.maxY, true);
  }
});

test("ships outside the arena are destroyed", () => {
  const world = createBattleScene();
  const shipsBefore = countShips(world);
  const [flagship] = getComponents(world, Component.PlayerControlled).keys();
  const position = getComponent(world, flagship, Component.Position);
  position.x = world.arena.maxX + 1;

  applyWorldBoundary(world);
  removeDestroyedShips(world);

  assert.equal(countShips(world), shipsBefore - 1);
  assert.equal(getComponent(world, flagship, Component.Position), undefined);
  // an escort was promoted so the player keeps a ship
  assert.equal(getComponents(world, Component.PlayerControlled).size, 1);
});

test("ships inside the arena are untouched by the boundary", () => {
  const world = createBattleScene();
  const shipsBefore = countShips(world);

  applyWorldBoundary(world);
  removeDestroyedShips(world);

  assert.equal(countShips(world), shipsBefore);
});

test("worlds without an arena never destroy ships at the boundary", () => {
  const world = createBattleScene();
  delete world.arena;
  const [flagship] = getComponents(world, Component.PlayerControlled).keys();
  getComponent(world, flagship, Component.Position).x = 1e9;
  const shipsBefore = countShips(world);

  applyWorldBoundary(world);
  removeDestroyedShips(world);

  assert.equal(countShips(world), shipsBefore);
});

function countShips(world) {
  return [...getComponents(world, Component.Faction).entries()]
    .filter(([entity, faction]) => (faction.id === FactionId.Player || faction.id === FactionId.Hostile)
      && getComponent(world, entity, Component.BodyKind)?.value === BodyKind.Ship).length;
}
