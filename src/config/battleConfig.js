export const BattleModelConfig = Object.freeze({
  planetCount: Object.freeze({ min: 1, max: 3 }),
  planetMass: Object.freeze({ min: 350, max: 750 }),
  planetArea: Object.freeze({ minX: -520, minY: -240, maxX: 520, maxY: 240 }),
  planetSpacing: 240,
  planetPlacementAttempts: 20,
  resourcePlanetChance: 0.25,
  resourceMinerals: Object.freeze({ min: 600, max: 1400 }),
  enemyCount: Object.freeze({ min: 3, max: 6 }),
  enemyAnchor: Object.freeze({ minX: -280, maxX: 280, minY: -560, maxY: -440 }),
  enemyFacing: Math.PI / 2,
  arenaMargin: 400
});

export const BattleViewConfig = Object.freeze({
  planetRadius: Object.freeze({ min: 30, max: 52 }),
  enemyShipRadius: 50,
  arena: Object.freeze({
    borderColor: "rgba(248, 113, 113, 0.45)",
    borderWidth: 2
  })
});
