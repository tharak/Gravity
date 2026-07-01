import { BodyKind, ThrusterSlot } from "../ecs/components.js";

export const bodyColors = Object.freeze({
  [BodyKind.Planet]: "#5fa8ff",
  [BodyKind.ResourcePlanet]: "#36d399",
  [BodyKind.Ship]: "#ff667a",
  [BodyKind.Station]: "#b8c2d6"
});

export const thrusterColors = Object.freeze({
  [ThrusterSlot.MainBack]: "#ffb454",
  [ThrusterSlot.FrontLeft]: "#7dd3fc",
  [ThrusterSlot.FrontRight]: "#38bdf8",
  [ThrusterSlot.TopLeft]: "#c084fc",
  [ThrusterSlot.TopRight]: "#f472b6",
  [ThrusterSlot.BottomLeft]: "#36d399",
  [ThrusterSlot.BottomRight]: "#a3e635"
});
