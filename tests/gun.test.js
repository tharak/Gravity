import assert from "node:assert/strict";
import test from "node:test";
import { GunModelConfig } from "../src/config/gunConfig.js";
import { BodyKind, Component } from "../src/ecs/components.js";
import { createWorld, getComponent, getComponents, queryEntities } from "../src/ecs/world.js";
import { removeExpiredDamagePopups } from "../src/game/damage.js";
import { createProjectile, createShip } from "../src/game/factory.js";
import {
  createPlayerInput,
  GunAimMode,
  GunShootMode,
  setGunAim,
  setGunAimMode,
  setGunShooting,
  setGunShootMode,
  setKeyboardShooting
} from "../src/input/playerInput.js";
import { applyGuns } from "../src/systems/gunSystem.js";
import { updateProjectiles } from "../src/systems/projectileSystem.js";

test("ships mount a gun EC with health, stress, and parent attachment", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0 });
  const guns = [...getComponents(world, Component.Gun).keys()];

  assert.equal(guns.length, 1);
  assert.equal(getComponent(world, guns[0], Component.Parent).entity, ship);
  assert.equal(getComponent(world, guns[0], Component.Health).max, GunModelConfig.maxHealth);
  assert.notEqual(getComponent(world, guns[0], Component.ComponentStress), undefined);
  assert.notEqual(getComponent(world, guns[0], Component.DamageTolerance), undefined);
});

test("manual aim follows the pointer and manual shoot fires a projectile", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one" });
  const input = createPlayerInput();
  setGunAim(input, 300, 0);
  setGunShooting(input, true);

  applyGuns(world, { "player-one": input }, 1 / 60);

  const projectiles = queryEntities(world, [Component.Projectile]);
  assert.equal(projectiles.length, 1);

  const velocity = getComponent(world, projectiles[0], Component.Velocity);
  assert.equal(velocity.x > 0, true);

  const battery = getComponent(world, ship, Component.Battery);
  assert.equal(battery.charge, battery.capacity - GunModelConfig.energyPerShot);

  const gun = [...getComponents(world, Component.Gun).values()][0];
  assert.equal(gun.firing, true);
  assert.equal(gun.cooldown, GunModelConfig.fireCooldownSeconds);
});

test("firing respects the cooldown between shots", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, playerControlled: "player-one", batteryCapacity: 100 });
  const input = createPlayerInput();
  setGunAim(input, 300, 0);
  setGunShooting(input, true);

  applyGuns(world, { "player-one": input }, 1 / 60);
  applyGuns(world, { "player-one": input }, 1 / 60);
  assert.equal(queryEntities(world, [Component.Projectile]).length, 1);

  applyGuns(world, { "player-one": input }, GunModelConfig.fireCooldownSeconds);
  assert.equal(queryEntities(world, [Component.Projectile]).length, 2);
});

test("shooting heats the gun and drains the battery per shot", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one" });
  const input = createPlayerInput();
  setGunShooting(input, true);

  applyGuns(world, { "player-one": input }, 1 / 60);

  const gunEntity = [...getComponents(world, Component.Gun).keys()][0];
  assert.equal(getComponent(world, gunEntity, Component.ComponentStress).heat, GunModelConfig.heatPerShot);
  assert.equal(getComponent(world, ship, Component.Battery).charge, 25 - GunModelConfig.energyPerShot);
});

test("a destroyed or drained gun does not fire", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, playerControlled: "player-one" });
  const input = createPlayerInput();
  setGunShooting(input, true);

  const gunEntity = [...getComponents(world, Component.Gun).keys()][0];
  getComponent(world, gunEntity, Component.Health).current = 0;
  applyGuns(world, { "player-one": input }, 1 / 60);
  assert.equal(queryEntities(world, [Component.Projectile]).length, 0);

  getComponent(world, gunEntity, Component.Health).current = 25;
  getComponent(world, ship, Component.Battery).charge = GunModelConfig.energyPerShot - 1;
  applyGuns(world, { "player-one": input }, 1 / 60);
  assert.equal(queryEntities(world, [Component.Projectile]).length, 0);
});

test("the gun holds fire when the next shot would exceed heat tolerance", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, playerControlled: "player-one" });
  const input = createPlayerInput();
  setGunShooting(input, true);

  const gunEntity = [...getComponents(world, Component.Gun).keys()][0];
  const tolerance = getComponent(world, gunEntity, Component.DamageTolerance);
  getComponent(world, gunEntity, Component.ComponentStress).heat = tolerance.heat - GunModelConfig.heatPerShot + 1;

  applyGuns(world, { "player-one": input }, 1 / 60);

  const gun = getComponent(world, gunEntity, Component.Gun);
  assert.equal(gun.overheated, true);
  assert.equal(queryEntities(world, [Component.Projectile]).length, 0);
});

test("an overheated gun stays holding fire until it cools to the resume threshold", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, playerControlled: "player-one" });
  const input = createPlayerInput();
  setGunShooting(input, true);

  const gunEntity = [...getComponents(world, Component.Gun).keys()][0];
  const gun = getComponent(world, gunEntity, Component.Gun);
  const stress = getComponent(world, gunEntity, Component.ComponentStress);
  const tolerance = getComponent(world, gunEntity, Component.DamageTolerance);
  gun.overheated = true;

  stress.heat = tolerance.heat * GunModelConfig.heatResumeRatio + 10;
  applyGuns(world, { "player-one": input }, 1 / 60);
  assert.equal(gun.overheated, true);
  assert.equal(queryEntities(world, [Component.Projectile]).length, 0);

  stress.heat = tolerance.heat * GunModelConfig.heatResumeRatio;
  applyGuns(world, { "player-one": input }, 1 / 60);
  assert.equal(gun.overheated, false);
  assert.equal(queryEntities(world, [Component.Projectile]).length, 1);
});

test("automatic aim tracks the nearest ship", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, playerControlled: "player-one" });
  createShip(world, { x: -400, y: 0 });
  createShip(world, { x: 200, y: 0 });
  const input = createPlayerInput();
  setGunAimMode(input, GunAimMode.Automatic);

  applyGuns(world, { "player-one": input }, 1 / 60);

  const gun = [...getComponents(world, Component.Gun).values()][0];
  assert.equal(Math.cos(gun.aimAngle) > 0.9, true);
});

test("automatic shoot only fires when a ship is in range", () => {
  const outOfRangeWorld = createWorld();
  createShip(outOfRangeWorld, { x: 0, y: 0, playerControlled: "player-one" });
  createShip(outOfRangeWorld, { x: GunModelConfig.range * 3, y: 0 });
  const input = createPlayerInput();
  setGunAimMode(input, GunAimMode.Automatic);
  setGunShootMode(input, GunShootMode.Automatic);

  applyGuns(outOfRangeWorld, { "player-one": input }, 1 / 60);
  assert.equal(queryEntities(outOfRangeWorld, [Component.Projectile]).length, 0);

  const inRangeWorld = createWorld();
  createShip(inRangeWorld, { x: 0, y: 0, playerControlled: "player-one" });
  createShip(inRangeWorld, { x: GunModelConfig.range / 2, y: 0 });

  applyGuns(inRangeWorld, { "player-one": input }, 1 / 60);
  assert.equal(queryEntities(inRangeWorld, [Component.Projectile]).length, 1);
});

test("space key controls manual shooting", () => {
  const input = createPlayerInput();

  assert.equal(setKeyboardShooting(input, "Space", true), true);
  assert.equal(input.gun.shooting, true);
  assert.equal(setKeyboardShooting(input, "Space", false), true);
  assert.equal(input.gun.shooting, false);
  assert.equal(setKeyboardShooting(input, "KeyX", true), false);
});

test("projectiles damage what they hit and are removed", () => {
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

  assert.equal(health.current, health.max - 8);
  assert.equal(queryEntities(world, [Component.Projectile]).length, 0);
  assert.equal(queryEntities(world, [Component.DamagePopup]).length, 1);
});

test("projectiles do not hit the ship that fired them", () => {
  const world = createWorld();
  const shooter = createShip(world, { x: 0, y: 0 });
  createProjectile(world, {
    firedBy: shooter,
    x: 10,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 0.05,
    radius: 3,
    damage: 8,
    lifetimeSeconds: 2
  });

  updateProjectiles(world);

  assert.equal(getComponent(world, shooter, Component.Health).current, 100);
  assert.equal(queryEntities(world, [Component.Projectile]).length, 1);
});

test("projectiles expire after their lifetime", () => {
  const world = createWorld();
  createProjectile(world, {
    firedBy: 9999,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 0.05,
    radius: 3,
    damage: 8,
    lifetimeSeconds: 1
  });

  world.time = 2;
  updateProjectiles(world);

  assert.equal(queryEntities(world, [Component.Projectile]).length, 0);
  assert.equal(world.entities.size, 0);
});

test("damage popups expire and are removed from the world", () => {
  const world = createWorld();
  createShip(world, { x: 100, y: 0 });
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
  assert.equal(queryEntities(world, [Component.DamagePopup]).length, 1);

  world.time = 2;
  removeExpiredDamagePopups(world);
  assert.equal(queryEntities(world, [Component.DamagePopup]).length, 0);
});

test("projectile bodies are entities with physics components", () => {
  const world = createWorld();
  const projectile = createProjectile(world, {
    firedBy: 1,
    x: 0,
    y: 0,
    vx: 10,
    vy: 0,
    mass: 0.05,
    radius: 3,
    damage: 8,
    lifetimeSeconds: 2
  });

  assert.equal(getComponent(world, projectile, Component.BodyKind), undefined);
  assert.notEqual(getComponent(world, projectile, Component.Position), undefined);
  assert.notEqual(getComponent(world, projectile, Component.Velocity), undefined);
  assert.notEqual(getComponent(world, projectile, Component.Acceleration), undefined);
  assert.notEqual(getComponent(world, projectile, Component.Mass), undefined);
  assert.notEqual(getComponent(world, projectile, Component.Health), undefined);
});
