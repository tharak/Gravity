import assert from "node:assert/strict";
import test from "node:test";
import { Component, ThrusterSlot } from "../src/ecs/components.js";
import { createWorld, getComponent, queryEntities } from "../src/ecs/world.js";
import { createShip } from "../src/game/factory.js";
import { applyPlayerInput, mapManualInputToThrusterPower } from "../src/systems/playerInputSystem.js";

test("up joystick input activates the main back thruster on an upward-facing ship", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": { active: true, alignWithShip: true, inverted: false, x: 0, y: -1, strength: 0.75 }
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.MainBack).power, 0.75);
  assert.ok(Math.abs(acceleration.x) < 1e-12);
  assert.equal(acceleration.y, -75);
});

test("down joystick input activates both front reverse thrusters", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": { active: true, alignWithShip: true, inverted: false, x: 0, y: 1, strength: 1 }
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).power, 1);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).power, 1);
  assert.ok(Math.abs(acceleration.x) < 1e-12);
  assert.equal(acceleration.y, 144);
});

test("right joystick input no longer activates top or bottom side thrusters", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ active: true, x: 1, y: 0, strength: 0.5 })
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.TopLeft).power, 0);
  assert.equal(getThruster(world, ThrusterSlot.TopRight).power, 0);
  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).power, 0);
  assert.equal(getThruster(world, ThrusterSlot.BottomRight).power, 0);
  assert.ok(Math.abs(acceleration.x) < 1e-12);
  assert.ok(Math.abs(acceleration.y) < 1e-12);
});

test("top side control activates only top thrusters", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ active: true, x: 0, y: 0, strength: 0, topStrength: 0.6 })
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.TopLeft).power, 0.6);
  assert.equal(getThruster(world, ThrusterSlot.TopRight).power, 0.6);
  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).power, 0);
  assert.equal(getThruster(world, ThrusterSlot.BottomRight).power, 0);
  assert.ok(Math.abs(acceleration.x - 69.6) < 1e-12);
  assert.ok(Math.abs(acceleration.y) < 1e-12);
});

test("bottom side control activates only bottom thrusters", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ active: true, x: 0, y: 0, strength: 0, bottomStrength: 0.4 })
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.TopLeft).power, 0);
  assert.equal(getThruster(world, ThrusterSlot.TopRight).power, 0);
  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).power, 0.4);
  assert.equal(getThruster(world, ThrusterSlot.BottomRight).power, 0.4);
  assert.ok(Math.abs(acceleration.x + 46.4) < 1e-12);
  assert.ok(Math.abs(acceleration.y) < 1e-12);
});

test("invert flips manual joystick input", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": { active: true, alignWithShip: true, inverted: true, x: 0, y: -1, strength: 1 }
  });

  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).power, 1);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).power, 1);
});

test("released input stabilizes opposite current velocity", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, vx: 0, vy: -90, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": { active: false, alignWithShip: true, inverted: false, x: 0, y: 0, strength: 0 }
  });

  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).power, 0.5);
});

test("inactive stopped ship clears thruster power", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": { active: true, alignWithShip: true, inverted: false, x: 0, y: -1, strength: 1 }
  });
  applyPlayerInput(world, {
    "player-one": { active: false, alignWithShip: true, inverted: false, x: 0, y: 0, strength: 0 }
  });

  for (const entity of queryEntities(world, [Component.Thruster])) {
    assert.equal(getComponent(world, entity, Component.Thruster).power, 0);
  }
});

test("local diagonal command combines main and matching side thruster", () => {
  const powerBySlot = mapManualInputToThrusterPower(
    { x: 0.7, y: -0.7, strength: 0.9 },
    { bottom: { active: true, strength: 0.5 } }
  );

  assert.equal(powerBySlot.get(ThrusterSlot.MainBack), 0.9);
  assert.equal(powerBySlot.get(ThrusterSlot.BottomLeft), 0.5);
  assert.equal(powerBySlot.get(ThrusterSlot.BottomRight), 0.5);
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

function createInput({ active, x, y, strength, topStrength = 0, bottomStrength = 0 }) {
  return {
    active,
    alignWithShip: true,
    inverted: false,
    x,
    y,
    strength,
    sideControls: {
      top: { active: topStrength > 0, strength: topStrength },
      bottom: { active: bottomStrength > 0, strength: bottomStrength }
    }
  };
}
