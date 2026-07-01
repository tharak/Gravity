import assert from "node:assert/strict";
import test from "node:test";
import { Component } from "../src/ecs/components.js";
import { createWorld, getComponent } from "../src/ecs/world.js";
import { createShip } from "../src/game/factory.js";
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
