import assert from "node:assert/strict";
import test from "node:test";
import { ShieldModelConfig } from "../src/config/shieldConfig.js";
import { Component } from "../src/ecs/components.js";
import { createWorld, getComponent, getComponents, queryEntities } from "../src/ecs/world.js";
import { createProjectile, createShip } from "../src/game/factory.js";
import { applyShields } from "../src/systems/shieldSystem.js";
import { updateProjectiles } from "../src/systems/projectileSystem.js";

test("ships mount a shield EC with health, stress, and full strength", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0 });
  const shields = [...getComponents(world, Component.Shield).entries()];

  assert.equal(shields.length, 1);
  const [entity, shield] = shields[0];
  assert.equal(getComponent(world, entity, Component.Parent).entity, ship);
  assert.equal(getComponent(world, entity, Component.Health).max, ShieldModelConfig.maxHealth);
  assert.notEqual(getComponent(world, entity, Component.ComponentStress), undefined);
  assert.notEqual(getComponent(world, entity, Component.DamageTolerance), undefined);
  assert.equal(shield.strength, ShieldModelConfig.maxStrength);
});

test("the shield absorbs projectile damage before it reaches the hull", () => {
  const world = createWorld();
  const target = createShip(world, { x: 100, y: 0 });
  const health = getComponent(world, target, Component.Health);
  createProjectile(world, {
    firedBy: 9999,
    x: 60,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 0.05,
    radius: 3,
    damage: 8,
    lifetimeSeconds: 2
  });

  updateProjectiles(world);

  const [shieldEntity, shield] = [...getComponents(world, Component.Shield).entries()][0];
  assert.equal(health.current, health.max);
  assert.equal(shield.strength, ShieldModelConfig.maxStrength - 8);
  assert.equal(shield.lastHitAt, world.time);
  assert.equal(getComponent(world, shieldEntity, Component.ComponentStress).heat, 8 * ShieldModelConfig.heatPerAbsorbedDamage);
  assert.equal(queryEntities(world, [Component.Projectile]).length, 0);
  assert.equal(queryEntities(world, [Component.DamagePopup]).length, 0);
});

test("damage beyond the shield strength passes through to the hull", () => {
  const world = createWorld();
  const target = createShip(world, { x: 100, y: 0 });
  const health = getComponent(world, target, Component.Health);
  const shield = [...getComponents(world, Component.Shield).values()][0];
  shield.strength = 3;
  createProjectile(world, {
    firedBy: 9999,
    x: 60,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 0.05,
    radius: 3,
    damage: 8,
    lifetimeSeconds: 2
  });

  updateProjectiles(world);

  assert.equal(shield.strength, 0);
  assert.equal(health.current, health.max - 5);
  assert.equal(queryEntities(world, [Component.DamagePopup]).length, 1);
});

test("a destroyed shield does not block projectile damage", () => {
  const world = createWorld();
  const target = createShip(world, { x: 100, y: 0 });
  const health = getComponent(world, target, Component.Health);
  const [shieldEntity, shield] = [...getComponents(world, Component.Shield).entries()][0];
  getComponent(world, shieldEntity, Component.Health).current = 0;
  createProjectile(world, {
    firedBy: 9999,
    x: 60,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 0.05,
    radius: 3,
    damage: 8,
    lifetimeSeconds: 2
  });

  updateProjectiles(world);

  assert.equal(shield.strength, ShieldModelConfig.maxStrength);
  assert.equal(health.current, health.max - 8);
});

test("shield strength recharges from the ship battery", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, batteryCapacity: 100, batteryCharge: 20 });
  const battery = getComponent(world, ship, Component.Battery);
  const shield = [...getComponents(world, Component.Shield).values()][0];
  shield.strength = 10;

  applyShields(world, 1);

  assert.equal(shield.strength, 10 + ShieldModelConfig.rechargeRatePerSecond);
  assert.equal(battery.charge, 20 - ShieldModelConfig.rechargeRatePerSecond * ShieldModelConfig.energyPerStrength);
});

test("shield recharge is capped at max strength and limited by battery charge", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, batteryCapacity: 100, batteryCharge: 100 });
  const shield = [...getComponents(world, Component.Shield).values()][0];
  shield.strength = 29;

  applyShields(world, 10);
  assert.equal(shield.strength, ShieldModelConfig.maxStrength);

  shield.strength = 0;
  getComponent(world, ship, Component.Battery).charge = 1;
  applyShields(world, 10);
  assert.equal(shield.strength, 1);
  assert.equal(getComponent(world, ship, Component.Battery).charge, 0);
});

test("a destroyed shield does not recharge", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, batteryCapacity: 100, batteryCharge: 100 });
  const [shieldEntity, shield] = [...getComponents(world, Component.Shield).entries()][0];
  getComponent(world, shieldEntity, Component.Health).current = 0;
  shield.strength = 0;

  applyShields(world, 1);

  assert.equal(shield.strength, 0);
});
