import assert from "node:assert/strict";
import test from "node:test";
import { Component, ThrusterSlot } from "../src/ecs/components.js";
import { createWorld, getComponent, queryEntities } from "../src/ecs/world.js";
import { createShip } from "../src/game/factory.js";
import { clearPlayerInput, createPlayerInput, setDirectionalInput } from "../src/input/playerInput.js";
import { applyPlayerInput, getSectorSlots, mapInputToThrusterPower } from "../src/systems/playerInputSystem.js";

test("directional input helpers set and clear held button thrust", () => {
  const input = createPlayerInput();

  setDirectionalInput(input, { x: -1, y: 1 });
  assert.deepEqual(input, { active: true, x: -1, y: 1, strength: 1 });

  clearPlayerInput(input);
  assert.deepEqual(input, { active: false, x: 0, y: 0, strength: 0 });
});

test("up button sector activates the main back thruster on an upward-facing ship", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ x: 0, y: -1, strength: 0.75 })
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.MainBack).power, 0.75);
  assert.ok(Math.abs(acceleration.x) < 1e-12);
  assert.equal(acceleration.y, -75);
});

test("down button sector activates both front reverse thrusters", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ x: 0, y: 1, strength: 1 })
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).power, 1);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).power, 1);
  assert.ok(Math.abs(acceleration.x) < 1e-12);
  assert.equal(acceleration.y, 144);
});

test("right button sector activates thrusters 6 and 7", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ x: 1, y: 0, strength: 0.5 })
  });

  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.BottomRight).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.TopLeft).power, 0);
  assert.equal(getThruster(world, ThrusterSlot.TopRight).power, 0);
});

test("left button sector activates thrusters 4 and 5", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ x: -1, y: 0, strength: 0.5 })
  });

  assert.equal(getThruster(world, ThrusterSlot.TopLeft).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.TopRight).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).power, 0);
  assert.equal(getThruster(world, ThrusterSlot.BottomRight).power, 0);
});

test("diagonal buttons activate the requested corner thrusters", () => {
  assertWorldInputActivates({ x: 1, y: -1 }, ThrusterSlot.BottomRight);
  assertWorldInputActivates({ x: 1, y: 1 }, ThrusterSlot.BottomLeft);
  assertWorldInputActivates({ x: -1, y: 1 }, ThrusterSlot.TopLeft);
  assertWorldInputActivates({ x: -1, y: -1 }, ThrusterSlot.TopRight);
});

test("cardinal sector mapping remains wider than diagonal sectors", () => {
  assert.deepEqual(getSectorSlots(...unitVector(25)), [ThrusterSlot.MainBack]);
  assert.deepEqual(getSectorSlots(...unitVector(35)), [ThrusterSlot.BottomRight]);
  assert.deepEqual(getSectorSlots(...unitVector(65)), [ThrusterSlot.BottomLeft, ThrusterSlot.BottomRight]);
  assert.deepEqual(getSectorSlots(...unitVector(115)), [ThrusterSlot.BottomLeft, ThrusterSlot.BottomRight]);
  assert.deepEqual(getSectorSlots(...unitVector(125)), [ThrusterSlot.BottomLeft]);
});

test("released input stabilizes opposite current velocity", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, vx: 0, vy: -90, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ active: false, x: 0, y: 0, strength: 0 })
  });

  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).power, 0.5);
});

test("inactive stopped ship clears thruster power", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ x: 0, y: -1, strength: 1 })
  });
  applyPlayerInput(world, {
    "player-one": createInput({ active: false, x: 0, y: 0, strength: 0 })
  });

  for (const entity of queryEntities(world, [Component.Thruster])) {
    assert.equal(getComponent(world, entity, Component.Thruster).power, 0);
  }
});

test("sector mapping keeps power percentage from distance", () => {
  const powerBySlot = mapInputToThrusterPower({ x: 1, y: 0, strength: 0.42 });

  assert.equal(powerBySlot.get(ThrusterSlot.MainBack), 0.42);
});

test("ship thrusters have visible debug numbers", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0 });

  const numbers = queryEntities(world, [Component.Thruster])
    .map((entity) => getComponent(world, entity, Component.Thruster).number)
    .sort((a, b) => a - b);

  assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7]);
});

function unitVector(degrees) {
  const radians = degrees * Math.PI / 180;
  return [Math.cos(radians), Math.sin(radians)];
}

function assertWorldInputActivates(input, expectedSlot) {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ ...input, strength: 1 })
  });

  for (const slot of [
    ThrusterSlot.TopLeft,
    ThrusterSlot.TopRight,
    ThrusterSlot.BottomLeft,
    ThrusterSlot.BottomRight
  ]) {
    assert.equal(getThruster(world, slot).power, slot === expectedSlot ? 1 : 0);
  }
}

function getThruster(world, slot) {
  for (const entity of queryEntities(world, [Component.Thruster])) {
    const thruster = getComponent(world, entity, Component.Thruster);
    if (thruster.slot === slot) {
      return thruster;
    }
  }

  throw new Error(`Missing thruster ${slot}`);
}

function createInput({ active = true, x, y, strength }) {
  return {
    active,
    x,
    y,
    strength
  };
}
