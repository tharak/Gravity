import assert from "node:assert/strict";
import test from "node:test";
import { Component } from "../src/ecs/components.js";
import { createWorld, getComponent } from "../src/ecs/world.js";
import { createBody } from "../src/game/factory.js";
import { applyGravity } from "../src/systems/gravitySystem.js";
import { integrateMotion } from "../src/systems/integrationSystem.js";

test("gravity accelerates bodies toward each other with mass-scaled symmetry", () => {
  const world = createWorld();
  const left = createBody(world, { kind: "planet", x: -10, y: 0, mass: 2, radius: 1 });
  const right = createBody(world, { kind: "planet", x: 10, y: 0, mass: 6, radius: 1 });

  applyGravity(world, {
    gravitationalConstant: 100,
    softening: 0
  });

  const leftAcceleration = getComponent(world, left, Component.Acceleration);
  const rightAcceleration = getComponent(world, right, Component.Acceleration);

  assert.ok(leftAcceleration.x > 0);
  assert.ok(rightAcceleration.x < 0);
  assert.equal(leftAcceleration.y, 0);
  assert.equal(rightAcceleration.y, 0);
  assert.ok(Math.abs(leftAcceleration.x * 2 + rightAcceleration.x * 6) < 1e-12);
});

test("integration updates velocity before position with a fixed timestep", () => {
  const world = createWorld();
  const entity = createBody(world, { kind: "ship", x: 0, y: 0, vx: 1, vy: -2, mass: 1, radius: 1 });
  const acceleration = getComponent(world, entity, Component.Acceleration);
  acceleration.x = 4;
  acceleration.y = 8;

  integrateMotion(world, 0.5);

  const velocity = getComponent(world, entity, Component.Velocity);
  const position = getComponent(world, entity, Component.Position);

  assert.deepEqual(velocity, { x: 3, y: 2 });
  assert.deepEqual(position, { x: 1.5, y: 1 });
  assert.equal(world.time, 0.5);
});

test("a seeded two-body orbit remains bounded over short simulation windows", () => {
  const world = createWorld();
  createBody(world, { kind: "star", x: 0, y: 0, mass: 9000, radius: 22 });
  const planet = createBody(world, {
    kind: "planet",
    x: 210,
    y: 0,
    vx: 0,
    vy: 55,
    mass: 28,
    radius: 10
  });

  for (let i = 0; i < 180; i += 1) {
    applyGravity(world, { gravitationalConstant: 72, softening: 16 });
    integrateMotion(world, 1 / 60);
  }

  const position = getComponent(world, planet, Component.Position);
  const distance = Math.hypot(position.x, position.y);
  assert.ok(distance > 120);
  assert.ok(distance < 320);
});


test("static gravity sources pull ships without moving themselves", () => {
  const world = createWorld();
  const planet = createBody(world, {
    kind: "planet",
    x: 100,
    y: 0,
    mass: 500,
    radius: 10,
    static: true
  });
  const ship = createBody(world, { kind: "ship", x: 0, y: 0, mass: 1, radius: 2 });

  applyGravity(world, { gravitationalConstant: 20, softening: 0 });
  integrateMotion(world, 1);

  const planetPosition = getComponent(world, planet, Component.Position);
  const shipPosition = getComponent(world, ship, Component.Position);
  const shipVelocity = getComponent(world, ship, Component.Velocity);

  assert.deepEqual(planetPosition, { x: 100, y: 0 });
  assert.ok(shipVelocity.x > 0);
  assert.ok(shipPosition.x > 0);
});

test("static bodies are not dynamic acceleration targets", () => {
  const world = createWorld();
  const planet = createBody(world, {
    kind: "planet",
    x: 0,
    y: 0,
    mass: 500,
    radius: 10,
    static: true
  });
  createBody(world, { kind: "ship", x: 100, y: 0, mass: 1, radius: 2 });

  applyGravity(world, { gravitationalConstant: 20, softening: 0 });

  assert.equal(getComponent(world, planet, Component.Acceleration), undefined);
  assert.equal(getComponent(world, planet, Component.Velocity), undefined);
});


test("integration updates angular velocity before rotation", () => {
  const world = createWorld();
  const entity = createBody(world, {
    kind: "ship",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 1,
    radius: 10,
    rotation: 0,
    angular: true,
    angularVelocity: 2,
    momentOfInertia: 4
  });

  getComponent(world, entity, Component.AngularAcceleration).value = 8;
  integrateMotion(world, 0.5);

  assert.equal(getComponent(world, entity, Component.AngularVelocity).value, 6);
  assert.equal(getComponent(world, entity, Component.Rotation).angle, 3);
});
