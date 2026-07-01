import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { Component, ThrusterSlot } from "../src/ecs/components.js";
import { createWorld, getComponent, queryEntities } from "../src/ecs/world.js";
import { createShip } from "../src/game/factory.js";
import {
  clearPlayerInput,
  createPlayerInput,
  setPowerLevel,
  setThrusterEnabled,
  toggleThruster
} from "../src/input/playerInput.js";
import { applyPlayerInput } from "../src/systems/playerInputSystem.js";
import { thrusterColors } from "../src/game/thrusterPalette.js";

test("thruster input helpers toggle switches and clamp power", () => {
  const input = createPlayerInput();

  toggleThruster(input, ThrusterSlot.MainBack);
  assert.equal(input.activeSlots.has(ThrusterSlot.MainBack), true);

  toggleThruster(input, ThrusterSlot.MainBack);
  assert.equal(input.activeSlots.has(ThrusterSlot.MainBack), false);

  setThrusterEnabled(input, ThrusterSlot.TopLeft, true);
  setPowerLevel(input, 1.4);
  assert.equal(input.powerLevel, 1);
  assert.equal(input.activeSlots.has(ThrusterSlot.TopLeft), true);

  clearPlayerInput(input);
  assert.equal(input.activeSlots.size, 0);
  assert.equal(input.powerLevel, 1);
});

test("control panel shows battery, power, and one switch per thruster", () => {
  const html = readIndexHtml();

  assert.ok(html.includes('class="battery-widget"'));
  assert.ok(html.includes('id="thruster-power"'));
  assert.equal(html.includes('<small>'), false);
  for (const slot of Object.values(ThrusterSlot)) {
    assert.ok(html.includes('data-thruster-slot="' + slot + '"'));
  }
});

test("each thruster uses one shared unique color", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0 });

  const colors = Object.values(thrusterColors);
  assert.equal(new Set(colors).size, Object.values(ThrusterSlot).length);

  for (const slot of Object.values(ThrusterSlot)) {
    assert.equal(getThruster(world, slot).color, thrusterColors[slot]);
  }
});

test("ships start with battery and thruster energy costs", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0 });

  const batteries = queryEntities(world, [Component.Battery]);
  assert.equal(batteries.length, 1);
  assert.deepEqual(getComponent(world, batteries[0], Component.Battery), {
    capacity: 100,
    charge: 100,
    rechargeRate: 1
  });
  assert.equal(getThruster(world, ThrusterSlot.MainBack).energyUsePerSecond, 3);
  assert.equal(getThruster(world, ThrusterSlot.TopLeft).energyUsePerSecond, 1);
});

test("main back thruster uses battery power and applies throttle", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });
  const input = createInput([ThrusterSlot.MainBack], 0.5);

  applyPlayerInput(world, { "player-one": input }, 1);

  const battery = getComponent(world, ship, Component.Battery);
  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.MainBack).power, 0.5);
  assert.equal(acceleration.y, -500);
  assert.equal(battery.charge, 98.5);
  assert.equal(battery.outputRate, 1.5);
  assertAngularAcceleration(world, ship, 0);
});

test("secondary thrusters drain one unit per second at full power", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterAcceleration: 100 });
  const input = createInput([ThrusterSlot.TopLeft], 1);

  applyPlayerInput(world, { "player-one": input }, 1);

  const battery = getComponent(world, ship, Component.Battery);
  assert.equal(getThruster(world, ThrusterSlot.TopLeft).power, 1);
  assert.equal(battery.charge, 99);
  assert.equal(battery.outputRate, 1);
  assert.notEqual(getComponent(world, ship, Component.AngularAcceleration).value, 0);
});

test("battery recharge runs when no thrusters are selected", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one" });
  const battery = getComponent(world, ship, Component.Battery);
  battery.charge = 50;

  applyPlayerInput(world, { "player-one": createInput([], 1) }, 2);

  assert.equal(battery.charge, 52);
  assert.equal(battery.outputRate, 0);
  assertAllThrustersOff(world);
});

test("battery limits thrust when there is not enough charge", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one" });
  const battery = getComponent(world, ship, Component.Battery);
  battery.charge = 1;

  applyPlayerInput(world, { "player-one": createInput([ThrusterSlot.MainBack], 1) }, 1);

  assert.equal(getThruster(world, ThrusterSlot.MainBack).power, 2 / 3);
  assert.equal(battery.charge, 0);
  assert.equal(battery.outputRate, 2);
});

test("disabled thrusters do not auto-stabilize the ship", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, vx: 0, vy: -90, playerControlled: "player-one" });
  const battery = getComponent(world, ship, Component.Battery);
  battery.charge = 80;

  applyPlayerInput(world, { "player-one": createInput([], 1) }, 1);

  assert.equal(getComponent(world, ship, Component.Acceleration).x, 0);
  assert.equal(getComponent(world, ship, Component.Acceleration).y, 0);
  assert.equal(battery.charge, 81);
  assertAllThrustersOff(world);
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

test("thruster entities keep parent-relative view attachment", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0 });

  for (const entity of queryEntities(world, [Component.Thruster, Component.Parent])) {
    assert.equal(getComponent(world, entity, Component.Parent).entity, ship);
  }
});

function createInput(slots, powerLevel) {
  const input = createPlayerInput();
  for (const slot of slots) {
    setThrusterEnabled(input, slot, true);
  }
  setPowerLevel(input, powerLevel);
  return input;
}

function getThruster(world, slot) {
  for (const entity of queryEntities(world, [Component.Thruster])) {
    const thruster = getComponent(world, entity, Component.Thruster);
    if (thruster.slot === slot) {
      return thruster;
    }
  }

  throw new Error("Missing thruster " + slot);
}

function assertAllThrustersOff(world) {
  for (const entity of queryEntities(world, [Component.Thruster])) {
    const thruster = getComponent(world, entity, Component.Thruster);
    assert.equal(thruster.power, 0);
    assert.equal(thruster.stabilizing, false);
  }
}

function assertAngularAcceleration(world, ship, expected) {
  assert.equal(Math.abs(getComponent(world, ship, Component.AngularAcceleration).value) < 1e-12, expected === 0);
}

function readIndexHtml() {
  return fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
}
