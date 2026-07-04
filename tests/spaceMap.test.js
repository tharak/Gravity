import assert from "node:assert/strict";
import test from "node:test";
import { SpaceMapModelConfig } from "../src/config/spaceMapConfig.js";
import { createRandom, deriveRegionSeed, hashCombine } from "../src/core/random.js";
import { findRegionAt, generateSpaceMap } from "../src/game/spaceMap.js";

const epsilon = 1e-6;

test("createRandom is deterministic for a fixed seed", () => {
  const first = createRandom(1337);
  const second = createRandom(1337);
  const firstValues = [first(), first(), first()];
  const secondValues = [second(), second(), second()];

  assert.deepEqual(firstValues, secondValues);
  assert.equal(firstValues.every((value) => value >= 0 && value < 1), true);
});

test("createRandom produces different streams for different seeds", () => {
  const first = createRandom(1);
  const second = createRandom(2);

  assert.notDeepEqual([first(), first(), first()], [second(), second(), second()]);
});

test("deriveRegionSeed is deterministic and distinct across regions", () => {
  const seeds = [];
  for (let index = 0; index < SpaceMapModelConfig.regionCount; index += 1) {
    seeds.push(deriveRegionSeed(SpaceMapModelConfig.seed, index));
  }

  assert.equal(new Set(seeds).size, SpaceMapModelConfig.regionCount);
  assert.equal(seeds[0], deriveRegionSeed(SpaceMapModelConfig.seed, 0));
  assert.equal(hashCombine(1, 2), hashCombine(1, 2));
  assert.notEqual(hashCombine(1, 2), hashCombine(2, 1));
});

test("generateSpaceMap is deterministic for the configured seed", () => {
  const first = generateSpaceMap();
  const second = generateSpaceMap();

  assert.deepEqual(first, second);
  assert.equal(first.seed, SpaceMapModelConfig.seed);
});

test("generateSpaceMap changes with the seed", () => {
  const first = generateSpaceMap({ ...SpaceMapModelConfig, seed: 1 });
  const second = generateSpaceMap({ ...SpaceMapModelConfig, seed: 2 });

  assert.notDeepEqual(first.regions.map((region) => region.site), second.regions.map((region) => region.site));
});

test("generateSpaceMap covers the bounds with valid regions", () => {
  const map = generateSpaceMap();
  const { bounds } = map;

  assert.equal(map.regions.length, SpaceMapModelConfig.regionCount);
  for (const region of map.regions) {
    assert.equal(region.polygon.length >= 3, true);
    assert.equal(region.seed, deriveRegionSeed(map.seed, region.index));
    assert.equal(region.site.x >= bounds.minX && region.site.x <= bounds.maxX, true);
    assert.equal(region.site.y >= bounds.minY && region.site.y <= bounds.maxY, true);
    for (const vertex of region.polygon) {
      assert.equal(vertex.x >= bounds.minX - epsilon && vertex.x <= bounds.maxX + epsilon, true);
      assert.equal(vertex.y >= bounds.minY - epsilon && vertex.y <= bounds.maxY + epsilon, true);
    }
  }
});

test("Lloyd relaxation moves the sites", () => {
  const raw = generateSpaceMap({ ...SpaceMapModelConfig, relaxationIterations: 0 });
  const relaxed = generateSpaceMap({ ...SpaceMapModelConfig, relaxationIterations: 2 });

  assert.notDeepEqual(raw.regions.map((region) => region.site), relaxed.regions.map((region) => region.site));
});

test("findRegionAt returns the nearest region", () => {
  const map = generateSpaceMap();

  for (const region of map.regions) {
    assert.equal(findRegionAt(map, region.site), region);
  }

  const probe = { x: 0, y: 0 };
  const expected = map.regions.reduce((best, region) => {
    const bestDistance = (probe.x - best.site.x) ** 2 + (probe.y - best.site.y) ** 2;
    const distance = (probe.x - region.site.x) ** 2 + (probe.y - region.site.y) ** 2;
    return distance < bestDistance ? region : best;
  });
  assert.equal(findRegionAt(map, probe), expected);
});

test("generateSpaceMap output is frozen", () => {
  const map = generateSpaceMap();

  assert.equal(Object.isFrozen(map), true);
  assert.equal(Object.isFrozen(map.regions), true);
  assert.equal(Object.isFrozen(map.regions[0]), true);
  assert.equal(Object.isFrozen(map.regions[0].site), true);
  assert.equal(Object.isFrozen(map.regions[0].polygon), true);
  assert.equal(Object.isFrozen(map.regions[0].polygon[0]), true);
});
