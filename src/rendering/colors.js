import { BodyKind } from "../ecs/components.js";

export const bodyColors = Object.freeze({
  [BodyKind.Planet]: "#5fa8ff",
  [BodyKind.ResourcePlanet]: "#36d399",
  [BodyKind.Ship]: "#ff667a",
  [BodyKind.Star]: "#ffd166"
});
