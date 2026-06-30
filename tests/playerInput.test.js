import assert from "node:assert/strict";
import test from "node:test";
import { Component } from "../src/ecs/components.js";
import { createWorld, getComponent } from "../src/ecs/world.js";
import { createBody } from "../src/game/factory.js";
import { applyGravity } from "../src/systems/gravitySystem.js";
import { applyPlayerInput } from "../src/systems/playerInputSystem.js";

test("player input adds thrust acceleration after gravity", () => {
  const world = createWorld();
  const ship = createBody(world, {
    kind: "ship",
    x: 0,
    y: 0,
    mass: 1,
    radius: 1,
    playerControlled: "player-one",
    thrust: { acceleration: 50 }
  });

  applyGravity(world, { gravitationalConstant: 100, softening: 0 });
  applyPlayerInput(world, {
    "player-one": {
      active: true,
      x: 0.6,
      y: -0.8,
      strength: 0.5
    }
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(acceleration.x, 15);
  assert.equal(acceleration.y, -20);
});

test("inactive player input leaves acceleration unchanged", () => {
  const world = createWorld();
  const ship = createBody(world, {
    kind: "ship",
    x: 0,
    y: 0,
    mass: 1,
    radius: 1,
    playerControlled: "player-one",
    thrust: { acceleration: 50 }
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  acceleration.x = 3;
  acceleration.y = 4;

  applyPlayerInput(world, {
    "player-one": {
      active: false,
      x: 1,
      y: 0,
      strength: 1
    }
  });

  assert.deepEqual(acceleration, { x: 3, y: 4 });
});
