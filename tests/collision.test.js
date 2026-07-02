import assert from "node:assert/strict";
import test from "node:test";
import { BodyKind, Component } from "../src/ecs/components.js";
import { createWorld, getComponent } from "../src/ecs/world.js";
import { createBody, createShip } from "../src/game/factory.js";
import { resolveCollisions } from "../src/systems/collisionSystem.js";

test("collision resolver separates overlapping ships and changes closing velocity", () => {
  const world = createWorld();
  const left = createShip(world, { x: -20, y: 0, vx: 20, vy: 0, radius: 50 });
  const right = createShip(world, { x: 20, y: 0, vx: -20, vy: 0, radius: 50 });

  resolveCollisions(world);

  const leftPosition = getComponent(world, left, Component.Position);
  const rightPosition = getComponent(world, right, Component.Position);
  const leftVelocity = getComponent(world, left, Component.Velocity);
  const rightVelocity = getComponent(world, right, Component.Velocity);
  const distance = Math.hypot(rightPosition.x - leftPosition.x, rightPosition.y - leftPosition.y);

  assert.ok(distance >= 100);
  assert.ok(leftVelocity.x < 20);
  assert.ok(rightVelocity.x > -20);
});

test("collision resolver separates ships from static planets", () => {
  const world = createWorld();
  const ship = createShip(world, { x: -45, y: 0, vx: 20, vy: 0, radius: 50 });
  const planet = createBody(world, {
    kind: BodyKind.Planet,
    x: 0,
    y: 0,
    mass: 900,
    radius: 50,
    static: true
  });

  resolveCollisions(world);

  const shipPosition = getComponent(world, ship, Component.Position);
  const planetPosition = getComponent(world, planet, Component.Position);
  const shipVelocity = getComponent(world, ship, Component.Velocity);
  const distance = Math.hypot(shipPosition.x - planetPosition.x, shipPosition.y - planetPosition.y);

  assert.ok(distance >= 100);
  assert.deepEqual(planetPosition, { x: 0, y: 0 });
  assert.ok(shipVelocity.x < 0);
});

test("ship collision damage reduces HP on hard impacts", () => {
  const world = createWorld();
  const ship = createShip(world, { x: -45, y: 0, vx: 20, vy: 0, radius: 50, health: 75, maxHealth: 100 });
  createBody(world, {
    kind: BodyKind.Planet,
    x: 0,
    y: 0,
    mass: 900,
    radius: 50,
    static: true
  });

  resolveCollisions(world);

  const health = getComponent(world, ship, Component.Health);
  assert.ok(health.current < 75);
  assert.ok(health.current > 0);
});

test("soft collisions below the damage threshold do not reduce HP", () => {
  const world = createWorld();
  const ship = createShip(world, { x: -45, y: 0, vx: 3, vy: 0, radius: 50 });
  createBody(world, {
    kind: BodyKind.Planet,
    x: 0,
    y: 0,
    mass: 900,
    radius: 50,
    static: true
  });

  resolveCollisions(world);

  assert.equal(getComponent(world, ship, Component.Health).current, 100);
});
