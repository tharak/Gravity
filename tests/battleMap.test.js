import assert from "node:assert/strict";
import test from "node:test";
import { BattleModelConfig, BattleViewConfig } from "../src/config/battleConfig.js";
import { FleetFormation } from "../src/config/fleetConfig.js";
import { SpaceMapModelConfig } from "../src/config/spaceMapConfig.js";
import { deriveRegionSeed } from "../src/core/random.js";
import { BodyKind, FactionId } from "../src/ecs/components.js";
import { generateBattleMap, getBattleIntel } from "../src/game/battleMap.js";

const regionSeeds = Array.from(
  { length: SpaceMapModelConfig.regionCount },
  (unused, index) => deriveRegionSeed(SpaceMapModelConfig.seed, index)
);

test("generateBattleMap is deterministic for a fixed seed", () => {
  assert.deepEqual(generateBattleMap(regionSeeds[0]), generateBattleMap(regionSeeds[0]));
});

test("generateBattleMap varies across region seeds", () => {
  const maps = regionSeeds.map((seed) => generateBattleMap(seed));
  const layouts = new Set(maps.map((map) => JSON.stringify([map.enemyFormation, map.planets, map.enemyShips])));

  assert.equal(layouts.size > 1, true);
});

test("battle maps roll planets within the configured ranges", () => {
  for (const seed of regionSeeds) {
    const map = generateBattleMap(seed);

    assert.equal(map.planets.length >= BattleModelConfig.planetCount.min, true);
    assert.equal(map.planets.length <= BattleModelConfig.planetCount.max, true);
    for (const planet of map.planets) {
      assert.equal(planet.static, true);
      assert.equal(planet.mass >= BattleModelConfig.planetMass.min && planet.mass <= BattleModelConfig.planetMass.max, true);
      assert.equal(planet.x >= BattleModelConfig.planetArea.minX && planet.x <= BattleModelConfig.planetArea.maxX, true);
      assert.equal(planet.y >= BattleModelConfig.planetArea.minY && planet.y <= BattleModelConfig.planetArea.maxY, true);
      assert.equal(planet.radius >= BattleViewConfig.planetRadius.min && planet.radius <= BattleViewConfig.planetRadius.max, true);
      if (planet.kind === BodyKind.ResourcePlanet) {
        assert.equal(planet.resources.minerals >= BattleModelConfig.resourceMinerals.min, true);
        assert.equal(planet.resources.minerals <= BattleModelConfig.resourceMinerals.max, true);
      } else {
        assert.equal(planet.kind, BodyKind.Planet);
      }
    }
  }
});

test("battle maps roll a hostile fleet with a valid formation", () => {
  const formations = new Set();

  for (const seed of regionSeeds) {
    const map = generateBattleMap(seed);
    formations.add(map.enemyFormation);

    assert.equal(Object.values(FleetFormation).includes(map.enemyFormation), true);
    assert.equal(map.enemyShips.length >= BattleModelConfig.enemyCount.min, true);
    assert.equal(map.enemyShips.length <= BattleModelConfig.enemyCount.max, true);

    const [flagship, ...escorts] = map.enemyShips;
    assert.equal(flagship.fleetSlot, undefined);
    assert.equal(flagship.x >= BattleModelConfig.enemyAnchor.minX && flagship.x <= BattleModelConfig.enemyAnchor.maxX, true);
    assert.equal(flagship.y >= BattleModelConfig.enemyAnchor.minY && flagship.y <= BattleModelConfig.enemyAnchor.maxY, true);
    assert.deepEqual(escorts.map((ship) => ship.fleetSlot), escorts.map((ship, index) => index));
    for (const ship of map.enemyShips) {
      assert.equal(ship.faction, FactionId.Hostile);
      assert.equal(ship.rotation, BattleModelConfig.enemyFacing);
    }
  }

  assert.equal(formations.size > 1, true);
});

test("battle intel summarizes the generated battle", () => {
  for (const seed of regionSeeds) {
    const intel = getBattleIntel(seed);
    const map = generateBattleMap(seed);

    assert.equal(Object.isFrozen(intel), true);
    assert.equal(intel.enemyCount, map.enemyShips.length);
    assert.equal(intel.formation, map.enemyFormation);
    assert.equal(intel.planetCount, map.planets.length);
    assert.equal(intel.resourcePlanetCount, map.planets.filter((planet) => planet.kind === BodyKind.ResourcePlanet).length);
  }

  assert.deepEqual(getBattleIntel(regionSeeds[0]), getBattleIntel(regionSeeds[0]));
});

test("battle map output is frozen", () => {
  const map = generateBattleMap(regionSeeds[0]);

  assert.equal(Object.isFrozen(map), true);
  assert.equal(Object.isFrozen(map.planets), true);
  assert.equal(Object.isFrozen(map.planets[0]), true);
  assert.equal(Object.isFrozen(map.enemyShips), true);
  assert.equal(Object.isFrozen(map.enemyShips[0]), true);
});
