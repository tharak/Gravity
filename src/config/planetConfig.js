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
