import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { EnemyAiConfig } from "../src/config/enemyConfig.js";
import { SimulationConfig } from "../src/config/simulationConfig.js";
import { Component, FactionId } from "../src/ecs/components.js";
import { createWorld, getComponent, getComponents, queryEntities } from "../src/ecs/world.js";
import { createProjectile, createShip } from "../src/game/factory.js";
import { createSimulation } from "../src/game/simulation.js";
import { createFleetBattleScene } from "../src/scenes/fleetBattleScene.js";
import { removeDestroyedShips } from "../src/systems/destructionSystem.js";
import { applyEnemyAi } from "../src/systems/enemyAiSystem.js";
import { applyGuns } from "../src/systems/gunSystem.js";
import { updateProjectiles } from "../src/systems/projectileSystem.js";
import { createPlayerInput, setFleetFormation, setGunAimMode, setGunShootMode, GunAimMode, GunShootMode } from "../src/input/playerInput.js";
import { FleetFormation } from "../src/config/fleetConfig.js";

const deltaSeconds = SimulationConfig.fixedDeltaSeconds;

test("enemy ship thrusts toward a distant opposing ship", () => {
  const world = createWorld();
  const enemy = createShip(world, { x: 0, y: 0, faction: FactionId.Hostile });
  createShip(world, { x: 0, y: 900, playerControlled: "player-one", faction: FactionId.Player });

  applyEnemyAi(world, deltaSeconds);

  assert.equal(getComponent(world, enemy, Component.Acceleration).y > 0, true);
});

test("enemy ship holds position at standoff range", () => {
  const world = createWorld();
  const standoff = 480 * EnemyAiConfig.standoffRangeRatio;
  const enemy = createShip(world, { x: 0, y: 0, rotation: 0, faction: FactionId.Hostile });
  createShip(world, { x: standoff, y: 0, playerControlled: "player-one", faction: FactionId.Player });

  applyEnemyAi(world, deltaSeconds);

  const acceleration = getComponent(world, enemy, Component.Acceleration);
  assert.equal(acceleration.x, 0);
  assert.equal(acceleration.y, 0);
});

test("enemy ai brakes instead of chasing a target out of the arena", () => {
  const world = createWorld();
  world.arena = Object.freeze({ minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 });
  const enemy = createShip(world, { x: 0, y: 940, vy: 120, faction: FactionId.Hostile });
  createShip(world, { x: 0, y: 2000, playerControlled: "player-one", faction: FactionId.Player });

  applyEnemyAi(world, deltaSeconds);

  assert.equal(getComponent(world, enemy, Component.Acceleration).y < 0, true);
});

test("enemy ai steers a stray ship back inside the arena", () => {
  const world = createWorld();
  world.arena = Object.freeze({ minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 });
  const enemy = createShip(world, { x: 990, y: 0, faction: FactionId.Hostile });
  createShip(world, { x: 3000, y: 0, playerControlled: "player-one", faction: FactionId.Player });

  applyEnemyAi(world, deltaSeconds);

  assert.equal(getComponent(world, enemy, Component.Acceleration).x < 0, true);
});

test("enemy guns automatically fire at opposing ships in range", () => {
  const world = createWorld();
  createShip(world, { x: 0, y: 0, faction: FactionId.Hostile });
  createShip(world, { x: 300, y: 0, playerControlled: "player-one", faction: FactionId.Player });

  applyGuns(world, {}, deltaSeconds);

  const projectiles = [...getComponents(world, Component.Projectile).values()];
  assert.equal(projectiles.length, 1);
  assert.equal(projectiles[0].faction, FactionId.Hostile);
});

test("fleet escorts automatically engage hostiles", () => {
  const world = createWorld();
  const flagship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", faction: FactionId.Player });
  createShip(world, { x: 0, y: 180, faction: FactionId.Player, fleet: { flagship, slotIndex: 0 } });
  createShip(world, { x: 0, y: -250, faction: FactionId.Hostile });

  applyGuns(world, {}, deltaSeconds);

  const factions = [...getComponents(world, Component.Projectile).values()].map((projectile) => projectile.faction).sort();
  assert.deepEqual(factions, [FactionId.Hostile, FactionId.Player]);
});

test("guns never target ships of the same faction", () => {
  const world = createWorld();
  const flagship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", faction: FactionId.Player });
  createShip(world, { x: 0, y: 180, faction: FactionId.Player, fleet: { flagship, slotIndex: 0 } });

  applyGuns(world, {}, deltaSeconds);

  assert.equal(getComponents(world, Component.Projectile).size, 0);
});

test("projectiles pass through same-faction ships and hit foes", () => {
  const world = createWorld();
  const friend = createShip(world, { x: 0, y: 0, faction: FactionId.Player });
  const foe = createShip(world, { x: 400, y: 0, faction: FactionId.Hostile });
  createProjectile(world, { firedBy: 999, faction: FactionId.Player, x: 0, y: 0, vx: 0, vy: 0, mass: 0.05, radius: 3, damage: 8, lifetimeSeconds: 5 });
  createProjectile(world, { firedBy: 999, faction: FactionId.Player, x: 400, y: 0, vx: 0, vy: 0, mass: 0.05, radius: 3, damage: 8, lifetimeSeconds: 5 });

  updateProjectiles(world);

  assert.equal(getComponent(world, friend, Component.Health).current, 100);
  assert.equal(getComponents(world, Component.Projectile).size, 1);
  const foeShield = queryEntities(world, [Component.Shield, Component.Parent])
    .filter((entity) => getComponent(world, entity, Component.Parent).entity === foe)
    .map((entity) => getComponent(world, entity, Component.Shield))[0];
  assert.equal(foeShield.strength < foeShield.maxStrength, true);
});

test("destroyed ships are removed together with their parts", () => {
  const world = createWorld();
  const ship = createShip(world, { x: 0, y: 0, faction: FactionId.Hostile });
  const partCount = queryEntities(world, [Component.Parent]).length;
  assert.equal(partCount > 0, true);

  getComponent(world, ship, Component.Health).current = 0;
  removeDestroyedShips(world);

  assert.equal(world.entities.has(ship), false);
  assert.equal(queryEntities(world, [Component.Parent]).length, 0);
});

test("a surviving escort is promoted when the flagship dies", () => {
  const world = createWorld();
  const flagship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", faction: FactionId.Player });
  const first = createShip(world, { x: 0, y: 180, faction: FactionId.Player, fleet: { flagship, slotIndex: 0 } });
  const second = createShip(world, { x: 0, y: 360, faction: FactionId.Player, fleet: { flagship, slotIndex: 1 } });

  getComponent(world, flagship, Component.Health).current = 0;
  removeDestroyedShips(world);

  assert.equal(world.entities.has(flagship), false);
  assert.deepEqual(getComponent(world, first, Component.PlayerControlled), { inputId: "player-one" });
  assert.equal(getComponent(world, first, Component.FleetMember), undefined);
  assert.equal(getComponent(world, second, Component.FleetMember).flagship, first);
});

test("promotion skips escorts destroyed in the same pass", () => {
  const world = createWorld();
  const flagship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", faction: FactionId.Player });
  const first = createShip(world, { x: 0, y: 180, faction: FactionId.Player, fleet: { flagship, slotIndex: 0 } });
  const second = createShip(world, { x: 0, y: 360, faction: FactionId.Player, fleet: { flagship, slotIndex: 1 } });

  getComponent(world, flagship, Component.Health).current = 0;
  getComponent(world, first, Component.Health).current = 0;
  removeDestroyedShips(world);

  assert.equal(world.entities.has(flagship), false);
  assert.equal(world.entities.has(first), false);
  assert.deepEqual(getComponent(world, second, Component.PlayerControlled), { inputId: "player-one" });
  assert.equal(getComponent(world, second, Component.FleetMember), undefined);
});

test("no ship is promoted when the whole fleet dies", () => {
  const world = createWorld();
  const flagship = createShip(world, { x: 0, y: 0, playerControlled: "player-one", faction: FactionId.Player });
  getComponent(world, flagship, Component.Health).current = 0;

  removeDestroyedShips(world);

  assert.equal(queryEntities(world, [Component.PlayerControlled]).length, 0);
});

test("the fleet battle wears the hostile squad down", () => {
  const world = createFleetBattleScene();
  const input = createPlayerInput();
  setGunAimMode(input, GunAimMode.Automatic);
  setGunShootMode(input, GunShootMode.Automatic);
  setFleetFormation(input, FleetFormation.Line);
  const simulation = createSimulation(world, { inputById: { "player-one": input } });
  const initialHostileHealth = getTotalFactionHealth(world, FactionId.Hostile);

  for (let step = 0; step < 60 * 60; step += 1) {
    simulation.step(deltaSeconds);
    if (countFactionShips(world, FactionId.Hostile) === 0) {
      break;
    }
  }

  assert.equal(getTotalFactionHealth(world, FactionId.Hostile) < initialHostileHealth, true);
  assert.equal(countFactionShips(world, FactionId.Player) > 0, true);
});

test("fleet battle controls expose the map", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.equal(html.match(/data-test-map="FleetBattle"/g).length, 2);
});

test("a game over overlay with retry is wired into the page", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.ok(html.includes('id="game-over"'));
  assert.ok(html.includes("data-retry"));
  assert.ok(html.includes('data-label="gameOver.title"'));
  const mainSource = fs.readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
  assert.ok(mainSource.includes("data-retry"));
  assert.ok(mainSource.includes("mapHasPlayerFleet"));
});

function countFactionShips(world, faction) {
  return queryEntities(world, [Component.Faction, Component.Health])
    .filter((entity) => getComponent(world, entity, Component.Faction).id === faction)
    .length;
}

function getTotalFactionHealth(world, faction) {
  return queryEntities(world, [Component.Faction, Component.Health])
    .filter((entity) => getComponent(world, entity, Component.Faction).id === faction)
    .reduce((total, entity) => total + getComponent(world, entity, Component.Health).current, 0);
}
