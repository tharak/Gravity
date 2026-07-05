import assert from "node:assert/strict";
import test from "node:test";
import { BodyKind, Component, FactionId } from "../src/ecs/components.js";
import { getComponent, getComponents } from "../src/ecs/world.js";
import { createFleetBattleScene } from "../src/scenes/fleetBattleScene.js";
import { createFleetTestScene } from "../src/scenes/fleetScene.js";
import { createGravityTestScene } from "../src/scenes/gravityTestScene.js";
import { createLevelSelectScene } from "../src/scenes/levelSelectScene.js";
import { createBattleScene } from "../src/scenes/battleScene.js";
import { createShipMovementScene } from "../src/scenes/shipMovementScene.js";
import { createSpaceMapScene, SpaceMapScene } from "../src/scenes/spaceMapScene.js";
import { getTestMap, TestMapId, testMaps } from "../src/scenes/testMaps.js";
import { BattleModelConfig } from "../src/config/battleConfig.js";
import { SpaceMapModelConfig } from "../src/config/spaceMapConfig.js";
import { deriveRegionSeed } from "../src/core/random.js";

test("LevelSelect map is an empty first screen", () => {
  const world = createLevelSelectScene();

  assert.equal(world.entities.size, 0);
});

test("SpaceMap is an empty world carrying a deterministic Voronoi campaign map", () => {
  const first = createSpaceMapScene();
  const second = createSpaceMapScene();

  assert.equal(first.entities.size, 0);
  assert.equal(first.spaceMap.regions.length, SpaceMapModelConfig.regionCount);
  assert.deepEqual(first.spaceMap, second.spaceMap);
  assert.equal(first.sectorIntel.size, SpaceMapModelConfig.regionCount);
  assert.equal(first.sectorIntel.get(0).enemyCount > 0, true);
  assert.deepEqual(first.sectorIntel.get(3), second.sectorIntel.get(3));
  assert.equal(SpaceMapScene.hidesCockpit, true);
  assert.equal(SpaceMapScene.isMenu, undefined);
});

test("ShipMovement map is a single-ship thruster debug map", () => {
  const world = createShipMovementScene();
  const kinds = [...getComponents(world, Component.BodyKind).values()].map((kind) => kind.value);
  const thrusters = getComponents(world, Component.Thruster);

  assert.deepEqual(kinds, [BodyKind.Ship]);
  assert.equal(thrusters.size, 7);
  assert.equal(getComponents(world, Component.ShipFrame).size, 1);
  assert.equal(getComponents(world, Component.Rotation).size, 1);
  assert.equal(getComponents(world, Component.AngularVelocity).size, 1);
  assert.equal(getComponents(world, Component.AngularAcceleration).size, 1);
  assert.equal(getComponents(world, Component.MomentOfInertia).size, 1);
  assert.equal(getComponents(world, Component.Battery).size, 1);
  assert.equal(getComponents(world, Component.SolarPanel).size, 1);
  assert.equal(getComponents(world, Component.Gun).size, 1);
  assert.equal(getComponents(world, Component.Shield).size, 1);
  assert.equal(getComponents(world, Component.Parent).size, 10);
  assert.equal([...getComponents(world, Component.Battery).values()][0].capacity > 25, true);

  const mainThruster = [...thrusters.entries()]
    .map(([entity]) => getComponent(world, entity, Component.Thruster))
    .find((thruster) => thruster.number === 1);
  assert.equal(mainThruster.maxAcceleration, 45);
  assert.equal(mainThruster.size, 3);
});

test("GravityTest map has static planets and multiple ships", () => {
  const world = createGravityTestScene();
  const kinds = [...getComponents(world, Component.BodyKind).values()].map((kind) => kind.value);

  assert.equal(kinds.filter((kind) => kind === BodyKind.Ship).length, 3);
  assert.equal(kinds.filter((kind) => kind === BodyKind.Planet).length, 2);
  assert.equal(kinds.filter((kind) => kind === BodyKind.ResourcePlanet).length, 1);
  assert.equal(getComponents(world, Component.StaticBody).size, 3);
  assert.equal(getComponents(world, Component.PlayerControlled).size, 1);
  assert.equal(getComponents(world, Component.Thruster).size, 21);
  assert.equal(getComponents(world, Component.SolarPanel).size, 3);
  assert.equal(getComponents(world, Component.Gun).size, 3);
  assert.equal(getComponents(world, Component.Shield).size, 3);
  assert.equal([...getComponents(world, Component.Battery).values()].every((battery) => battery.capacity > 25), true);
});

test("FleetTest map spawns a flagship with fleet escorts", () => {
  const world = createFleetTestScene();
  const kinds = [...getComponents(world, Component.BodyKind).values()].map((kind) => kind.value);
  const players = getComponents(world, Component.PlayerControlled);
  const members = [...getComponents(world, Component.FleetMember).values()];
  const [flagship] = players.keys();

  assert.equal(kinds.filter((kind) => kind === BodyKind.Ship).length, 5);
  assert.equal(kinds.filter((kind) => kind === BodyKind.Planet).length, 1);
  assert.equal(players.size, 1);
  assert.equal(members.length, 4);
  assert.equal(members.every((member) => member.flagship === flagship), true);
  assert.deepEqual(members.map((member) => member.slotIndex).sort(), [0, 1, 2, 3]);
});

test("FleetBattle map pits the player fleet against a hostile squad", () => {
  const world = createFleetBattleScene();
  const kinds = [...getComponents(world, Component.BodyKind).values()].map((kind) => kind.value);
  const factions = [...getComponents(world, Component.Faction).values()].map((faction) => faction.id);
  const [flagship] = getComponents(world, Component.PlayerControlled).keys();
  const members = [...getComponents(world, Component.FleetMember).values()];

  assert.equal(kinds.filter((kind) => kind === BodyKind.Ship).length, 8);
  assert.equal(kinds.filter((kind) => kind === BodyKind.Planet).length, 1);
  assert.equal(factions.filter((id) => id === FactionId.Player).length, 5);
  assert.equal(factions.filter((id) => id === FactionId.Hostile).length, 3);
  assert.equal(members.length, 4);
  assert.equal(members.every((member) => member.flagship === flagship), true);
});

test("Battle map is procedurally generated from the selected region seed", () => {
  const battleRegion = Object.freeze({
    regionIndex: 3,
    seed: deriveRegionSeed(SpaceMapModelConfig.seed, 3),
    spaceMapSeed: SpaceMapModelConfig.seed
  });
  const first = createBattleScene({ battleRegion });
  const second = createBattleScene({ battleRegion });
  const factions = [...getComponents(first, Component.Faction).values()].map((faction) => faction.id);
  const hostileCount = factions.filter((id) => id === FactionId.Hostile).length;
  const members = [...getComponents(first, Component.FleetMember).values()];
  const [flagship] = getComponents(first, Component.PlayerControlled).keys();
  const hostileEscorts = members.filter((member) => member.flagship !== flagship);

  assert.equal(first.battleMap.seed, battleRegion.seed);
  assert.deepEqual(first.battleMap, second.battleMap);
  assert.equal(factions.filter((id) => id === FactionId.Player).length, 5);
  assert.equal(hostileCount >= BattleModelConfig.enemyCount.min, true);
  assert.equal(hostileCount <= BattleModelConfig.enemyCount.max, true);
  assert.equal(hostileEscorts.length, hostileCount - 1);
  assert.equal(getComponents(first, Component.StaticBody).size >= BattleModelConfig.planetCount.min, true);
  assert.equal(getComponents(first, Component.StaticBody).size <= BattleModelConfig.planetCount.max, true);
});

test("Battle map falls back to the first region seed without a selection", () => {
  const world = createBattleScene();

  assert.equal(world.battleMap.seed, deriveRegionSeed(SpaceMapModelConfig.seed, 0));
});

test("test maps are selectable by stable ids", () => {
  assert.deepEqual(testMaps.map((map) => map.id), [TestMapId.SpaceMap, TestMapId.LevelSelect, TestMapId.ShipMovement, TestMapId.GravityTest, TestMapId.FleetTest, TestMapId.FleetBattle, TestMapId.Battle]);
  assert.equal(getTestMap(TestMapId.SpaceMap).id, "SpaceMap");
  assert.equal(getTestMap(TestMapId.LevelSelect).id, "LevelSelect");
  assert.equal(getTestMap(TestMapId.ShipMovement).id, "ShipMovement");
  assert.equal(getTestMap(TestMapId.GravityTest).id, "GravityTest");
  assert.equal(getTestMap(TestMapId.FleetTest).id, "FleetTest");
  assert.equal(getTestMap(TestMapId.FleetBattle).id, "FleetBattle");
  assert.equal(getTestMap(TestMapId.Battle).id, "Battle");
  assert.equal(getTestMap("missing").id, "SpaceMap");
});
