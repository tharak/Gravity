import assert from "node:assert/strict";
import test from "node:test";
import { Component, ThrusterSlot } from "../src/ecs/components.js";
import { createWorld, getComponent, queryEntities } from "../src/ecs/world.js";
import { createShip } from "../src/game/factory.js";
import { applyPlayerInput, mapInputToThrusterPower } from "../src/systems/playerInputSystem.js";

test("right joystick input activates the main back thruster", () => {
  const world = createWorld();
  const ship = createShip(world, {
    x: 0,
    y: 0,
    playerControlled: "player-one",
    thrusterAcceleration: 100
  });

  applyPlayerInput(world, {
    "player-one": { active: true, x: 1, y: 0, strength: 0.75 }
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  const mainThruster = getThruster(world, ThrusterSlot.MainBack);

  assert.equal(mainThruster.power, 0.75);
  assert.equal(acceleration.x, 75);
  assert.equal(acceleration.y, 0);
});

test("left joystick input activates both front reverse thrusters", () => {
  const world = createWorld();
  const ship = createShip(world, {
    x: 0,
    y: 0,
    playerControlled: "player-one",
    thrusterAcceleration: 100
  });

  applyPlayerInput(world, {
    "player-one": { active: true, x: -1, y: 0, strength: 1 }
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).power, 1);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).power, 1);
  assert.equal(acceleration.x, -144);
  assert.equal(acceleration.y, 0);
});

test("up joystick input activates bottom thrusters for upward movement", () => {
  const world = createWorld();
  const ship = createShip(world, {
    x: 0,
    y: 0,
    playerControlled: "player-one",
    thrusterAcceleration: 100
  });

  applyPlayerInput(world, {
    "player-one": { active: true, x: 0, y: -1, strength: 0.5 }
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.BottomRight).power, 0.5);
  assert.equal(acceleration.x, 0);
  assert.ok(Math.abs(acceleration.y + 58) < 1e-12);
});

test("inactive input clears thruster power", () => {
  const world = createWorld();
  createShip(world, {
    x: 0,
    y: 0,
    playerControlled: "player-one",
    thrusterAcceleration: 100
  });

  applyPlayerInput(world, {
    "player-one": { active: true, x: 1, y: 0, strength: 1 }
  });
  applyPlayerInput(world, {
    "player-one": { active: false, x: 0, y: 0, strength: 0 }
  });

  for (const entity of queryEntities(world, [Component.Thruster])) {
    assert.equal(getComponent(world, entity, Component.Thruster).power, 0);
  }
});

test("diagonal joystick area combines main and matching side thruster", () => {
  const powerBySlot = mapInputToThrusterPower({ active: true, x: 0.7, y: -0.7, strength: 0.9 });

  assert.equal(powerBySlot.get(ThrusterSlot.MainBack), 0.9);
  assert.equal(powerBySlot.get(ThrusterSlot.BottomRight), 0.9);
  assert.equal(powerBySlot.has(ThrusterSlot.BottomLeft), false);
});

function getThruster(world, slot) {
  for (const entity of queryEntities(world, [Component.Thruster])) {
    const thruster = getComponent(world, entity, Component.Thruster);
    if (thruster.slot === slot) {
      return thruster;
    }
  }

  throw new Error(`Missing thruster ${slot}`);
}
