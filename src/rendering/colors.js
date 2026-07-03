import { BodyKind, FactionId } from "../ecs/components.js";

export const bodyColors = Object.freeze({
  [BodyKind.Planet]: "#5fa8ff",
  [BodyKind.ResourcePlanet]: "#36d399",
  [BodyKind.Ship]: "#ff667a",
  [BodyKind.Station]: "#b8c2d6"
});

export const factionColors = Object.freeze({
  [FactionId.Hostile]: "#ff9f43"
});
