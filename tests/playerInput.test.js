import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
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

test("control buttons show their mapped thruster numbers", () => {
  const html = readIndexHtml();

  assert.ok(html.includes('aria-label="Front reverse thrusters 2 and 3"><span class="thruster-button__arrow">↑</span><span class="thruster-button__label">2+3</span></button>'));
  assert.ok(html.includes('aria-label="Main back thruster 1"><span class="thruster-button__arrow">↓</span><span class="thruster-button__label">1</span></button>'));
  assert.ok(html.includes('aria-label="Left thrusters 4 and 5"><span class="thruster-button__arrow">←</span><span class="thruster-button__label">4+5</span></button>'));
  assert.ok(html.includes('aria-label="Right thrusters 6 and 7"><span class="thruster-button__arrow">→</span><span class="thruster-button__label">6+7</span></button>'));
  assert.ok(html.includes('aria-label="Up left thruster 5"><span class="thruster-button__arrow">↖</span><span class="thruster-button__label">5</span></button>'));
  assert.ok(html.includes('aria-label="Up right thruster 7"><span class="thruster-button__arrow">↗</span><span class="thruster-button__label">7</span></button>'));
  assert.ok(html.includes('aria-label="Down left thruster 4"><span class="thruster-button__arrow">↙</span><span class="thruster-button__label">4</span></button>'));
  assert.ok(html.includes('aria-label="Down right thruster 6"><span class="thruster-button__arrow">↘</span><span class="thruster-button__label">6</span></button>'));
});

test("main back input sector activates the main back thruster on an upward-facing ship", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ x: 0, y: -1, strength: 0.75 })
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.MainBack).power, 0.75);
  assert.equal(getThruster(world, ThrusterSlot.MainBack).stabilizing, false);
  assert.ok(Math.abs(acceleration.x) < 1e-12);
  assert.equal(acceleration.y, -750);
  assertAngularAcceleration(world, ship, 0);
});

test("front reverse input sector activates both front reverse thrusters", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ x: 0, y: 1, strength: 1 })
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).power, 1);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).power, 1);
  assert.ok(Math.abs(acceleration.x) < 1e-12);
  assert.equal(acceleration.y, 200);
  assertAngularAcceleration(world, ship, 0);
});

test("right button sector activates thrusters 6 and 7", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ x: 1, y: 0, strength: 0.5 })
  });

  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.BottomRight).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.TopLeft).power, 0);
  assert.equal(getThruster(world, ThrusterSlot.TopRight).power, 0);
  assertAngularAcceleration(world, ship, 0);
});

test("left button sector activates thrusters 4 and 5", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ x: -1, y: 0, strength: 0.5 })
  });

  assert.equal(getThruster(world, ThrusterSlot.TopLeft).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.TopRight).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).power, 0);
  assert.equal(getThruster(world, ThrusterSlot.BottomRight).power, 0);
  assertAngularAcceleration(world, ship, 0);
});

test("diagonal buttons activate the requested corner thrusters", () => {
  assertWorldInputActivates({ x: 1, y: -1 }, ThrusterSlot.BottomRight);
  assertWorldInputActivates({ x: 1, y: 1 }, ThrusterSlot.BottomLeft);
  assertWorldInputActivates({ x: -1, y: 1 }, ThrusterSlot.TopLeft);
  assertWorldInputActivates({ x: -1, y: -1 }, ThrusterSlot.TopRight);
});

test("individual side thrusters rotate the ship", () => {
  assertWorldInputRotates({ x: 1, y: -1 });
  assertWorldInputRotates({ x: 1, y: 1 });
  assertWorldInputRotates({ x: -1, y: 1 });
  assertWorldInputRotates({ x: -1, y: -1 });
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
  const ship = createShip(world, { x: 0, y: 0, vx: 0, vy: -90, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ active: false, x: 0, y: 0, strength: 0 })
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).stabilizing, true);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).stabilizing, true);
  assertVelocityIsBeingReduced({ x: 0, y: -90 }, acceleration);
});

test("released input stabilizes lateral current velocity", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, vx: 90, vy: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ active: false, x: 0, y: 0, strength: 0 })
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.BottomRight).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).stabilizing, true);
  assert.equal(getThruster(world, ThrusterSlot.BottomRight).stabilizing, true);
  assertVelocityIsBeingReduced({ x: 90, y: 0 }, acceleration);
});

test("released input stabilizes diagonal current velocity", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, vx: 90, vy: -90, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ active: false, x: 0, y: 0, strength: 0 })
  });

  assertVelocityIsBeingReduced({ x: 90, y: -90 }, getComponent(world, ship, Component.Acceleration));
});

test("released input stabilizes using rotated thruster directions", () => {
  const world = createWorld();
  const ship = createShip(world, {
    x: 0,
    y: 0,
    vx: 90,
    vy: 0,
    rotation: 0,
    playerControlled: "player-one",
    thrusterAcceleration: 100
  });

  applyPlayerInput(world, {
    "player-one": createInput({ active: false, x: 0, y: 0, strength: 0 })
  });

  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).power, 0.5);
  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).stabilizing, true);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).stabilizing, true);
  assertVelocityIsBeingReduced({ x: 90, y: 0 }, acceleration);
});

test("inactive stopped ship clears thruster power and stabilize animation", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ x: 0, y: -1, strength: 1 })
  });
  applyPlayerInput(world, {
    "player-one": createInput({ active: false, x: 0, y: 0, strength: 0 })
  });

  for (const entity of queryEntities(world, [Component.Thruster])) {
    const thruster = getComponent(world, entity, Component.Thruster);
    assert.equal(thruster.power, 0);
    assert.equal(thruster.stabilizing, false);
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

test("main back thruster has ten times the baseline power", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, thrusterAcceleration: 100 });

  const main = getThruster(world, ThrusterSlot.MainBack);
  for (const slot of [
    ThrusterSlot.FrontLeft,
    ThrusterSlot.FrontRight,
    ThrusterSlot.TopLeft,
    ThrusterSlot.TopRight,
    ThrusterSlot.BottomLeft,
    ThrusterSlot.BottomRight
  ]) {
    assert.equal(main.maxAcceleration, getThruster(world, slot).maxAcceleration * 10);
  }
});

function readIndexHtml() {
  return fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
}

function assertAngularAcceleration(world, ship, expected) {
  assert.equal(Math.abs(getComponent(world, ship, Component.AngularAcceleration).value) < 1e-12, expected === 0);
}

function assertVelocityIsBeingReduced(velocity, acceleration) {
  assert.ok(velocity.x * acceleration.x + velocity.y * acceleration.y < 0);
}

function unitVector(degrees) {
  const radians = degrees * Math.PI / 180;
  return [Math.cos(radians), Math.sin(radians)];
}

function assertWorldInputRotates(input) {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });

  applyPlayerInput(world, {
    "player-one": createInput({ ...input, strength: 1 })
  });

  assert.notEqual(getComponent(world, ship, Component.AngularAcceleration).value, 0);
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
