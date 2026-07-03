import { BodyKind } from "../ecs/components.js";

export const GravityTestPlanetModelConfig = Object.freeze([
  Object.freeze({ id: "resource-west", kind: BodyKind.ResourcePlanet, mass: 900, resources: Object.freeze({ minerals: 1200 }), static: true }),
  Object.freeze({ id: "planet-east", kind: BodyKind.Planet, mass: 700, static: true }),
  Object.freeze({ id: "planet-south", kind: BodyKind.Planet, mass: 520, static: true })
]);

export const GravityTestPlanetViewConfig = Object.freeze([
  Object.freeze({ id: "resource-west", x: -280, y: -150, radius: 48 }),
  Object.freeze({ id: "planet-east", x: 230, y: -120, radius: 42 }),
  Object.freeze({ id: "planet-south", x: 20, y: 190, radius: 36 })
]);

export const FleetTestPlanetModelConfig = Object.freeze([
  Object.freeze({ id: "planet-northwest", kind: BodyKind.Planet, mass: 600, static: true })
]);

export const FleetTestPlanetViewConfig = Object.freeze([
  Object.freeze({ id: "planet-northwest", x: -420, y: -280, radius: 40 })
]);

export const FleetBattlePlanetModelConfig = Object.freeze([
  Object.freeze({ id: "planet-west", kind: BodyKind.Planet, mass: 550, static: true })
]);

export const FleetBattlePlanetViewConfig = Object.freeze([
  Object.freeze({ id: "planet-west", x: -520, y: -40, radius: 42 })
]);
