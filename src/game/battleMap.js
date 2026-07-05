import { BattleModelConfig, BattleViewConfig } from "../config/battleConfig.js";
import { FleetFormation, FleetModelConfig } from "../config/fleetConfig.js";
import { createRandom, randomInRange, randomInt, randomPick } from "../core/random.js";
import { rotate } from "../core/vector.js";
import { BodyKind, FactionId } from "../ecs/components.js";
import { getFormationOffset } from "./formations.js";

export function getBattleIntel(seed, model = BattleModelConfig) {
  const battleMap = generateBattleMap(seed, model);
  return Object.freeze({
    enemyCount: battleMap.enemyShips.length,
    formation: battleMap.enemyFormation,
    planetCount: battleMap.planets.length,
    resourcePlanetCount: battleMap.planets.filter((planet) => planet.kind === BodyKind.ResourcePlanet).length
  });
}

export function generateBattleMap(seed, model = BattleModelConfig, view = BattleViewConfig) {
  const random = createRandom(seed);
  const enemyFormation = randomPick(random, Object.values(FleetFormation));
  const planets = rollPlanets(random, model, view);
  const enemyShips = rollEnemyFleet(random, model, view, enemyFormation);

  return Object.freeze({
    seed,
    enemyFormation,
    planets: Object.freeze(planets.map((planet) => Object.freeze(planet))),
    enemyShips: Object.freeze(enemyShips.map((ship) => Object.freeze(ship)))
  });
}

function rollPlanets(random, model, view) {
  const planets = [];
  const count = randomInt(random, model.planetCount);

  for (let index = 0; index < count; index += 1) {
    const isResource = random() < model.resourcePlanetChance;
    const position = placePlanet(random, model, planets);
    planets.push({
      id: `planet-${index + 1}`,
      kind: isResource ? BodyKind.ResourcePlanet : BodyKind.Planet,
      mass: Math.round(randomInRange(random, model.planetMass)),
      static: true,
      ...(isResource ? { resources: Object.freeze({ minerals: Math.round(randomInRange(random, model.resourceMinerals)) }) } : {}),
      x: position.x,
      y: position.y,
      radius: Math.round(randomInRange(random, view.planetRadius))
    });
  }

  return planets;
}

function placePlanet(random, model, planets) {
  let candidate;
  for (let attempt = 0; attempt < model.planetPlacementAttempts; attempt += 1) {
    candidate = {
      x: Math.round(randomInRange(random, { min: model.planetArea.minX, max: model.planetArea.maxX })),
      y: Math.round(randomInRange(random, { min: model.planetArea.minY, max: model.planetArea.maxY }))
    };
    const spaced = planets.every((planet) => Math.hypot(planet.x - candidate.x, planet.y - candidate.y) >= model.planetSpacing);
    if (spaced) {
      return candidate;
    }
  }
  return candidate;
}

function rollEnemyFleet(random, model, view, formation) {
  const count = randomInt(random, model.enemyCount);
  const anchor = {
    x: Math.round(randomInRange(random, { min: model.enemyAnchor.minX, max: model.enemyAnchor.maxX })),
    y: Math.round(randomInRange(random, { min: model.enemyAnchor.minY, max: model.enemyAnchor.maxY }))
  };

  const ships = [{
    id: "raider-flagship",
    faction: FactionId.Hostile,
    rotation: model.enemyFacing,
    x: anchor.x,
    y: anchor.y,
    radius: view.enemyShipRadius
  }];

  for (let slot = 0; slot < count - 1; slot += 1) {
    const offset = getFormationOffset(formation, slot, FleetModelConfig.spacing);
    const rotated = rotate(offset.x, offset.y, model.enemyFacing);
    ships.push({
      id: `raider-${slot + 1}`,
      faction: FactionId.Hostile,
      rotation: model.enemyFacing,
      x: Math.round(anchor.x + rotated.x),
      y: Math.round(anchor.y + rotated.y),
      radius: view.enemyShipRadius,
      fleetSlot: slot
    });
  }

  return ships;
}
