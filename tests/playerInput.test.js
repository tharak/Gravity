import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { Component, ThrusterSlot } from "../src/ecs/components.js";
import { createWorld, getComponent, queryEntities } from "../src/ecs/world.js";
import { createShip } from "../src/game/factory.js";
import {
  ControllerMode,
  DirectionOrder,
  DirectionOrders,
  SpeedOrder,
  SpeedOrders,
  clearPlayerInput,
  createPlayerInput,
  setAutomaticDirection,
  setControllerMode,
  setSpeedLevel,
  setSpeedOrder,
  setKeyboardThrusters,
  setThrusterEnabled,
  toggleThruster
} from "../src/input/playerInput.js";
import { SHIP_FACING_UP } from "../src/game/factory.js";
import { WORLD_NORTH_ANGLE } from "../src/game/navigation.js";
import { applyPlayerInput } from "../src/systems/playerInputSystem.js";
import { thrusterColors } from "../src/game/thrusterPalette.js";
import { ThrusterModelConfig } from "../src/config/shipConfig.js";

test("manual controller toggles thrusters and sets speed orders", () => {
  const input = createPlayerInput();

  toggleThruster(input, ThrusterSlot.MainBack);
  assert.equal(input.activeSlots.has(ThrusterSlot.MainBack), true);

  toggleThruster(input, ThrusterSlot.MainBack);
  assert.equal(input.activeSlots.has(ThrusterSlot.MainBack), false);

  setThrusterEnabled(input, ThrusterSlot.TopLeft, true);
  setSpeedOrder(input, SpeedOrder.Flank);
  assert.equal(input.controllerMode, ControllerMode.Manual);
  assert.equal(input.speedOrder, SpeedOrder.Flank);
  assert.equal(input.speedLevel, 1.25);
  assert.equal(input.powerConsumptionWeight, 1.5);

  setSpeedOrder(input, SpeedOrder.Stop);
  assert.equal(input.speedOrder, SpeedOrder.Stop);
  assert.equal(input.speedLevel, 0);
  assert.equal(input.powerConsumptionWeight, 1);
  setSpeedOrder(input, SpeedOrder.Flank);
  assert.equal(input.activeSlots.has(ThrusterSlot.TopLeft), true);

  setSpeedLevel(input, 2);
  assert.equal(input.speedLevel, 1.25);
  assert.equal(input.powerConsumptionWeight, 1);

  setAutomaticDirection(input, DirectionOrder.West);
  assert.equal(input.controllerMode, ControllerMode.Automatic);
  assert.equal(input.activeSlots.size, 0);
  assert.equal(input.targetDirection, DirectionOrder.West);
  assert.equal(input.targetAngle, WORLD_NORTH_ANGLE - Math.PI / 2);

  clearPlayerInput(input);
  assert.equal(input.activeSlots.size, 0);
  assert.equal(input.controllerMode, ControllerMode.Manual);
  assert.equal(input.speedOrder, SpeedOrder.Stop);
  assert.equal(input.speedLevel, 0);
  assert.equal(input.powerConsumptionWeight, 1);
  assert.equal(input.targetDirection, DirectionOrder.North);
});

test("WASD keyboard input activates manual thruster groups", () => {
  const input = createPlayerInput();

  assert.equal(setKeyboardThrusters(input, "KeyA", true), true);
  assert.deepEqual([...input.activeSlots].sort(), [ThrusterSlot.BottomRight, ThrusterSlot.TopLeft].sort());
  setKeyboardThrusters(input, "KeyA", false);
  assert.equal(input.activeSlots.size, 0);

  setKeyboardThrusters(input, "KeyD", true);
  assert.deepEqual([...input.activeSlots].sort(), [ThrusterSlot.BottomLeft, ThrusterSlot.TopRight].sort());
  setKeyboardThrusters(input, "KeyD", false);

  setKeyboardThrusters(input, "KeyW", true);
  assert.deepEqual([...input.activeSlots], [ThrusterSlot.MainBack]);
  setKeyboardThrusters(input, "KeyW", false);

  setKeyboardThrusters(input, "KeyS", true);
  assert.deepEqual([...input.activeSlots].sort(), [ThrusterSlot.FrontLeft, ThrusterSlot.FrontRight].sort());
  assert.equal(setKeyboardThrusters(input, "KeyQ", true), false);
});

test("world north is the shared ship and automatic north reference", () => {
  const input = createPlayerInput();

  assert.equal(SHIP_FACING_UP, WORLD_NORTH_ANGLE);
  assert.equal(input.targetAngle, WORLD_NORTH_ANGLE);
  assert.equal(DirectionOrders.find((direction) => direction.id === DirectionOrder.North).angle, WORLD_NORTH_ANGLE);
});

test("manual control panel shows battery, speed orders, and one switch per thruster", () => {
  const html = readIndexHtml();

  assert.ok(html.includes('id="level-menu"'));
  assert.ok(html.includes('aria-label="Level select"'));
  assert.ok(html.includes('class="thruster-controls is-hidden"'));
  assert.ok(html.includes('aria-label="Test maps"'));
  assert.ok(html.includes('data-test-map="LevelSelect"'));
  assert.ok(html.includes('data-test-map="ShipMovement"'));
  assert.ok(html.includes('data-test-map="GravityTest"'));
  assert.ok(html.includes('id="hud-map"'));
  assert.ok(html.includes('id="hud-map" data-label="maps.LevelSelect"'));
  assert.ok(html.includes('id="hud-status" data-label="status.chooseLevel"'));
  assert.ok(html.includes('aria-label="Ship controller"'));
  assert.ok(html.includes('data-controller-mode="manual"'));
  assert.ok(html.includes('data-controller-mode="automatic"'));
  assert.ok(html.includes('class="health-readout"'));
  assert.ok(html.includes('id="ship-health"'));
  assert.ok(html.includes('100/100'));
  assert.ok(html.includes('class="battery-widget"'));
  assert.ok(html.includes('class="north-readout"'));
  assert.ok(html.includes('World N'));
  assert.ok(html.includes('class="controller-bay"'));
  assert.ok(html.includes('class="controller-panel manual-panel"'));
  assert.ok(html.includes('class="controller-panel automatic-panel"'));
  assert.ok(html.includes('aria-disabled="true"'));
  assert.equal(html.includes('data-controller-panel="automatic" hidden'), false);
  assert.ok(html.includes('data-speed-order="stop" aria-label="Stop and stabilize" aria-pressed="true" data-label="speedOrders.Stop.label"'));
  assert.ok(html.includes('data-speed-order="standard" aria-label="Standard speed" aria-pressed="false" data-label="speedOrders.Standard.label"'));
  assert.ok(html.includes('class="compass-control"'));
  assert.ok(html.includes('class="speed-control"'));
  assert.ok(html.includes('class="keyboard-control"'));
  assert.ok(html.includes('data-key-code="KeyW"'));
  assert.ok(fs.readFileSync(new URL("../src/main.js", import.meta.url), "utf8").includes("bindKeyboardThrusterControls"));
  assert.ok(fs.readFileSync(new URL("../src/input/playerInput.js", import.meta.url), "utf8").includes("syncKeyboardButtons"));
  assert.equal(html.includes('thruster-power'), false);
  assert.equal(html.includes('Power'), false);
  assert.equal(html.includes('<small>'), false);
  for (const order of SpeedOrders) {
    assert.ok(html.includes('data-speed-order="' + order.id + '"'));
  }
  for (const direction of DirectionOrders) {
    assert.ok(html.includes('data-direction-order="' + direction.id + '"'));
  }
  for (const slot of Object.values(ThrusterSlot)) {
    assert.ok(html.includes('data-thruster-slot="' + slot + '"'));
  }
});

test("automatic full speed north fires the main thruster when aligned", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterModels: createTestThrusterModels(100) });
  const input = createPlayerInput();
  setControllerMode(input, ControllerMode.Automatic);
  setAutomaticDirection(input, DirectionOrder.North);
  setSpeedOrder(input, SpeedOrder.Full);

  applyPlayerInput(world, { "player-one": input }, 1);

  const battery = getComponent(world, ship, Component.Battery);
  assert.equal(getThruster(world, ThrusterSlot.MainBack).power, 1);
  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(Math.abs(acceleration.x) < 1e-12, true);
  assert.equal(acceleration.y, -300);
  assert.equal(battery.charge, 96.25);
  assert.equal(battery.outputRate, 3.75);
});

test("automatic mode rotates toward the selected direction", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterModels: createTestThrusterModels(100) });
  const input = createPlayerInput();
  setControllerMode(input, ControllerMode.Automatic);
  setAutomaticDirection(input, DirectionOrder.East);
  setSpeedOrder(input, SpeedOrder.Full);

  applyPlayerInput(world, { "player-one": input }, 1);

  assert.equal(getThruster(world, ThrusterSlot.TopRight).power, 1);
  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).power, 1);
  assert.equal(getThruster(world, ThrusterSlot.MainBack).power < 1e-12, true);
  assert.equal(getComponent(world, ship, Component.AngularAcceleration).value > 0, true);
});

test("stop speed stabilizes linear movement", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, vy: -30, playerControlled: "player-one", thrusterModels: createTestThrusterModels(100) });
  const input = createPlayerInput();
  setSpeedOrder(input, SpeedOrder.Stop);

  applyPlayerInput(world, { "player-one": input }, 1);

  const battery = getComponent(world, ship, Component.Battery);
  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).power > 0, true);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).power > 0, true);
  assert.equal(getComponent(world, ship, Component.Acceleration).y > 0, true);
  assert.equal(battery.outputRate > 0, true);
});

test("stop speed stabilizes angular movement", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", angularVelocity: 0.5, thrusterModels: createTestThrusterModels(100) });
  const input = createPlayerInput();
  setSpeedOrder(input, SpeedOrder.Stop);

  applyPlayerInput(world, { "player-one": input }, 1);

  assert.equal(getThruster(world, ThrusterSlot.TopLeft).power > 0, true);
  assert.equal(getThruster(world, ThrusterSlot.BottomRight).power > 0, true);
  assert.equal(getComponent(world, ship, Component.AngularAcceleration).value < 0, true);
});

test("manual stop does not align with world north when already stable", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, rotation: 0, playerControlled: "player-one", thrusterModels: createTestThrusterModels(100) });
  const input = createPlayerInput();
  setSpeedOrder(input, SpeedOrder.Stop);

  applyPlayerInput(world, { "player-one": input }, 1);

  assertAllThrustersOff(world);
  assert.equal(getComponent(world, ship, Component.AngularAcceleration).value, 0);
  assert.equal(getComponent(world, ship, Component.Battery).outputRate, 0);
});

test("automatic stop stabilizes ship heading to selected direction", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterModels: createTestThrusterModels(100) });
  const input = createPlayerInput();
  setControllerMode(input, ControllerMode.Automatic);
  setAutomaticDirection(input, DirectionOrder.East);
  setSpeedOrder(input, SpeedOrder.Stop);

  applyPlayerInput(world, { "player-one": input }, 1);

  assert.equal(getThruster(world, ThrusterSlot.TopRight).power > 0, true);
  assert.equal(getThruster(world, ThrusterSlot.BottomLeft).power > 0, true);
  assert.equal(getComponent(world, ship, Component.AngularAcceleration).value > 0, true);
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

test("ships start with HP, battery, and thruster energy consumption", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0 });

  const batteries = queryEntities(world, [Component.Battery]);
  const health = queryEntities(world, [Component.Health]);
  assert.equal(batteries.length, 1);
  assert.equal(health.length, 1);
  assert.deepEqual(getComponent(world, health[0], Component.Health), {
    max: 100,
    current: 100
  });
  assert.deepEqual(getComponent(world, batteries[0], Component.Battery), {
    capacity: 100,
    charge: 100,
    rechargeRate: 1
  });
  assert.equal(getThruster(world, ThrusterSlot.MainBack).energyConsumption, 3);
  assert.equal(getThruster(world, ThrusterSlot.TopLeft).energyConsumption, 1);
});

test("main back thruster uses battery power and applies throttle", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterModels: createTestThrusterModels(100) });
  const input = createInput([ThrusterSlot.MainBack], 0.5);

  applyPlayerInput(world, { "player-one": input }, 1);

  const battery = getComponent(world, ship, Component.Battery);
  const acceleration = getComponent(world, ship, Component.Acceleration);
  assert.equal(getThruster(world, ThrusterSlot.MainBack).power, 0.5);
  assert.equal(acceleration.y, -150);
  assert.equal(battery.charge, 98.5);
  assert.equal(battery.outputRate, 1.5);
  assertAngularAcceleration(world, ship, 0);
});

test("full and flank speed orders increase battery drain without changing thrust", () => {
  const fullWorld = createWorld();
  const fullShip = createShip(fullWorld, { x: 0, y: 0, playerControlled: "player-one", thrusterModels: createTestThrusterModels(100) });
  const fullInput = createInput([ThrusterSlot.MainBack], 1);
  setSpeedOrder(fullInput, SpeedOrder.Full);

  applyPlayerInput(fullWorld, { "player-one": fullInput }, 1);

  assert.equal(getThruster(fullWorld, ThrusterSlot.MainBack).power, 1);
  assert.equal(getComponent(fullWorld, fullShip, Component.Battery).outputRate, 3.75);

  const flankWorld = createWorld();
  const flankShip = createShip(flankWorld, { x: 0, y: 0, playerControlled: "player-one", thrusterModels: createTestThrusterModels(100) });
  const flankInput = createInput([ThrusterSlot.MainBack], 1);
  setSpeedOrder(flankInput, SpeedOrder.Flank);

  applyPlayerInput(flankWorld, { "player-one": flankInput }, 1);

  assert.equal(getThruster(flankWorld, ThrusterSlot.MainBack).power, 1.25);
  assert.equal(getComponent(flankWorld, flankShip, Component.Battery).outputRate, 5.625);
});

test("secondary thrusters drain one unit per second at full power", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", thrusterModels: createTestThrusterModels(100) });
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

test("main back thruster has three times the baseline power", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, thrusterModels: createTestThrusterModels(100) });

  const main = getThruster(world, ThrusterSlot.MainBack);
  assert.equal(main.size, 3);
  assert.equal(main.viewSizeMultiplier, 0.5);
  for (const slot of [
    ThrusterSlot.FrontLeft,
    ThrusterSlot.FrontRight,
    ThrusterSlot.TopLeft,
    ThrusterSlot.TopRight,
    ThrusterSlot.BottomLeft,
    ThrusterSlot.BottomRight
  ]) {
    assert.equal(main.maxAcceleration, getThruster(world, slot).maxAcceleration * 3);
  }
});

test("thrusters have a configurable max speed", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, maxThrusterSpeed: 42 });

  for (const entity of queryEntities(world, [Component.Thruster])) {
    assert.equal(getComponent(world, entity, Component.Thruster).maxSpeed, 42);
  }
});

test("thrusters stop accelerating once their max speed is reached", () => {
  const world = createWorld();
  const ship = createShip(world, {
    x: 0,
    y: 0,
    vy: -20,
    playerControlled: "player-one",
    thrusterModels: createTestThrusterModels(100),
    maxThrusterSpeed: 20
  });
  const input = createInput([ThrusterSlot.MainBack], 1);

  applyPlayerInput(world, { "player-one": input }, 1);

  assert.equal(getThruster(world, ThrusterSlot.MainBack).power, 0);
  assert.equal(getComponent(world, ship, Component.Acceleration).y, 0);
  assert.equal(getComponent(world, ship, Component.Battery).outputRate, 0);
});

test("reverse thrusters can brake while the ship is over forward max speed", () => {
  const world = createWorld();
  const ship = createShip(world, {
    x: 0,
    y: 0,
    vy: -40,
    playerControlled: "player-one",
    thrusterModels: createTestThrusterModels(100),
    maxThrusterSpeed: 20
  });
  const input = createInput([ThrusterSlot.FrontLeft, ThrusterSlot.FrontRight], 1);

  applyPlayerInput(world, { "player-one": input }, 1);

  assert.equal(getThruster(world, ThrusterSlot.FrontLeft).power, 1);
  assert.equal(getThruster(world, ThrusterSlot.FrontRight).power, 1);
  assert.equal(getComponent(world, ship, Component.Acceleration).y > 0, true);
  assert.equal(getComponent(world, ship, Component.Battery).outputRate, 2);
});

test("thruster entities keep parent-relative view attachment", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0 });

  for (const entity of queryEntities(world, [Component.Thruster, Component.Parent])) {
    assert.equal(getComponent(world, entity, Component.Parent).entity, ship);
  }
});

function createTestThrusterModels(baselineAcceleration) {
  return ThrusterModelConfig.map((thruster) => ({
    ...thruster,
    acceleration: baselineAcceleration
  }));
}

function createInput(slots, powerLevel) {
  const input = createPlayerInput();
  for (const slot of slots) {
    setThrusterEnabled(input, slot, true);
  }
  setSpeedLevel(input, powerLevel);
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
