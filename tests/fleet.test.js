import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { FleetFormation, FleetFormationList } from "../src/config/fleetConfig.js";
import { SimulationConfig } from "../src/config/simulationConfig.js";
import { Component, ThrusterSlot } from "../src/ecs/components.js";
import { createWorld, getComponent, queryEntities } from "../src/ecs/world.js";
import { createShip } from "../src/game/factory.js";
import { getFormationOffset } from "../src/game/formations.js";
import { createPlayerInput, setFleetFormation } from "../src/input/playerInput.js";
import { applyFleetFormation } from "../src/systems/fleetSystem.js";
import { applyGravity } from "../src/systems/gravitySystem.js";
import { applyPlayerInput } from "../src/systems/playerInputSystem.js";
import { integrateMotion } from "../src/systems/integrationSystem.js";

const deltaSeconds = SimulationConfig.fixedDeltaSeconds;

test("formation offsets place slots for column, line, arrow, and chevron", () => {
  assert.deepEqual(getFormationOffset(FleetFormation.Column, 0, 140), { x: -140, y: 0 });
  assert.deepEqual(getFormationOffset(FleetFormation.Column, 1, 140), { x: -280, y: 0 });
  assert.deepEqual(getFormationOffset(FleetFormation.Column, 3, 140), { x: -560, y: 0 });

  assert.deepEqual(getFormationOffset(FleetFormation.Line, 0, 140), { x: 0, y: 140 });
  assert.deepEqual(getFormationOffset(FleetFormation.Line, 1, 140), { x: 0, y: -140 });
  assert.deepEqual(getFormationOffset(FleetFormation.Line, 2, 140), { x: 0, y: 280 });
  assert.deepEqual(getFormationOffset(FleetFormation.Line, 3, 140), { x: 0, y: -280 });

  assert.deepEqual(getFormationOffset(FleetFormation.Arrow, 0, 140), { x: -140, y: 140 });
  assert.deepEqual(getFormationOffset(FleetFormation.Arrow, 1, 140), { x: -140, y: -140 });
  assert.deepEqual(getFormationOffset(FleetFormation.Arrow, 2, 140), { x: -280, y: 280 });

  assert.deepEqual(getFormationOffset(FleetFormation.Chevron, 0, 140), { x: 140, y: 140 });
  assert.deepEqual(getFormationOffset(FleetFormation.Chevron, 1, 140), { x: 140, y: -140 });

  assert.deepEqual(getFormationOffset("unknown", 0, 140), { x: -140, y: 0 });
});

test("fleet member thrusts toward its column slot when aligned", () => {
  const world = createWorld();
  const { member } = createTestFleet(world, [{ x: 0, y: 400 }]);
  const input = createPlayerInput();

  applyFleetFormation(world, { "player-one": input }, deltaSeconds);

  assert.equal(getThruster(world, member, ThrusterSlot.MainBack).power > 0, true);
  assert.equal(getComponent(world, member, Component.Acceleration).y < 0, true);
});

test("fleet member turns toward its slot when misaligned", () => {
  const world = createWorld();
  const { member } = createTestFleet(world, [{ x: 0, y: 400, rotation: 0 }]);
  const input = createPlayerInput();

  applyFleetFormation(world, { "player-one": input }, deltaSeconds);

  assert.equal(getThruster(world, member, ThrusterSlot.TopLeft).power > 0, true);
  assert.equal(getThruster(world, member, ThrusterSlot.BottomRight).power > 0, true);
  assert.equal(getThruster(world, member, ThrusterSlot.MainBack).power < 1e-12, true);
  assert.equal(getComponent(world, member, Component.AngularAcceleration).value < 0, true);
});

test("fleet member settled at its slot keeps thrusters off", () => {
  const world = createWorld();
  const { member } = createTestFleet(world, [{ x: 0, y: 180 }]);
  const input = createPlayerInput();

  applyFleetFormation(world, { "player-one": input }, deltaSeconds);

  for (const thruster of getShipThrusters(world, member)) {
    assert.equal(thruster.power, 0);
  }
  assert.equal(getComponent(world, member, Component.AngularAcceleration).value, 0);
});

test("escort aims its nose at an enemy inside gun range", () => {
  const world = createWorld();
  const flagship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", faction: "player" });
  const member = createShip(world, { x: 0, y: 180, fleet: { flagship, slotIndex: 0 }, faction: "player" });
  createShip(world, { x: 400, y: 180, faction: "hostile" });
  const input = createPlayerInput();

  applyFleetFormation(world, { "player-one": input }, deltaSeconds);

  assert.equal(getComponent(world, member, Component.AngularAcceleration).value > 0, true);
});

test("escort holds the formation heading when enemies are out of range", () => {
  const world = createWorld();
  const flagship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", faction: "player" });
  const member = createShip(world, { x: 0, y: 180, fleet: { flagship, slotIndex: 0 }, faction: "player" });
  createShip(world, { x: 2000, y: 180, faction: "hostile" });
  const input = createPlayerInput();

  applyFleetFormation(world, { "player-one": input }, deltaSeconds);

  assert.equal(getComponent(world, member, Component.AngularAcceleration).value, 0);
});

test("escort steers back inside when its slot lies beyond the arena", () => {
  const world = createWorld();
  world.arena = Object.freeze({ minX: -2000, minY: -2000, maxX: 2000, maxY: 2000 });
  const flagship = createShip(world, { x: 0, y: 1860, playerControlled: "player-one" });
  const member = createShip(world, { x: 0, y: 2040, fleet: { flagship, slotIndex: 0 } });
  const input = createPlayerInput();

  applyFleetFormation(world, { "player-one": input }, deltaSeconds);

  assert.equal(getComponent(world, member, Component.Acceleration).y < 0, true);
});

test("changing the formation order pulls a settled member out of its slot", () => {
  const world = createWorld();
  const { member } = createTestFleet(world, [{ x: 0, y: 180 }]);
  const input = createPlayerInput();

  applyFleetFormation(world, { "player-one": input }, deltaSeconds);
  assert.equal(getTotalThrusterPower(world, member), 0);

  setFleetFormation(input, FleetFormation.Line);
  applyFleetFormation(world, { "player-one": input }, deltaSeconds);

  assert.equal(getTotalThrusterPower(world, member) > 0, true);
});

test("boid separation pushes crowded fleet members apart", () => {
  const world = createWorld();
  const { members } = createTestFleetMembers(world, [
    { x: 0, y: 140 },
    { x: 8, y: 140 }
  ]);
  const input = createPlayerInput();
  const initialDistance = getDistance(world, members[0], members[1]);

  for (let step = 0; step < 90; step += 1) {
    applyGravity(world, SimulationConfig);
    applyPlayerInput(world, { "player-one": input }, deltaSeconds);
    applyFleetFormation(world, { "player-one": input }, deltaSeconds);
    integrateMotion(world, deltaSeconds);
  }

  assert.equal(getDistance(world, members[0], members[1]) > initialDistance, true);
});

test("fleet member dodges sideways off a collision course", () => {
  const world = createWorld();
  const flagship = createShip(world, { x: 0, y: 0, vy: 120, playerControlled: "player-one" });
  const member = createShip(world, { x: 0, y: 180, fleet: { flagship, slotIndex: 0 } });
  const input = createPlayerInput();

  applyFleetFormation(world, { "player-one": input }, deltaSeconds);

  assert.equal(getComponent(world, member, Component.Acceleration).x > 0, true);
});

test("fleet members without a live flagship are skipped", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, fleet: { flagship: 9999, slotIndex: 0 } });

  assert.doesNotThrow(() => applyFleetFormation(world, {}, deltaSeconds));
});

test("fleet formation controls are wired in the cockpit panel", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

  assert.ok(html.includes('class="fleet-control"'));
  assert.ok(html.includes('data-label="controls.fleet"'));
  assert.ok(html.includes('data-test-map="FleetTest"'));
  for (const formation of FleetFormationList) {
    assert.ok(html.includes('data-fleet-formation="' + formation.id + '"'));
  }
});

function createTestFleet(world, followers) {
  const fleet = createTestFleetMembers(world, followers);
  return { ...fleet, member: fleet.members[0] };
}

function createTestFleetMembers(world, followers) {
  const flagship = createShip(world, { x: 0, y: 0, playerControlled: "player-one" });
  const members = followers.map((follower, index) => createShip(world, {
    ...follower,
    fleet: { flagship, slotIndex: follower.slotIndex ?? index }
  }));
  return { flagship, members };
}

function getShipThrusters(world, ship) {
  return queryEntities(world, [Component.Thruster, Component.Parent])
    .filter((entity) => getComponent(world, entity, Component.Parent).entity === ship)
    .map((entity) => getComponent(world, entity, Component.Thruster));
}

function getThruster(world, ship, slot) {
  const thruster = getShipThrusters(world, ship).find((candidate) => candidate.slot === slot);
  if (!thruster) {
    throw new Error("Missing thruster " + slot);
  }

  return thruster;
}

function getTotalThrusterPower(world, ship) {
  return getShipThrusters(world, ship).reduce((total, thruster) => total + thruster.power, 0);
}

function getDistance(world, first, second) {
  const firstPosition = getComponent(world, first, Component.Position);
  const secondPosition = getComponent(world, second, Component.Position);
  return Math.hypot(firstPosition.x - secondPosition.x, firstPosition.y - secondPosition.y);
}
