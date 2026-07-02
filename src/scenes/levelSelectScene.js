import { LabelConfig } from "../config/labelConfig.js";
import { createWorld } from "../ecs/world.js";

export const LevelSelectScene = Object.freeze({
  id: "LevelSelect",
  label: LabelConfig.maps.LevelSelect,
  isMenu: true
});

export function createLevelSelectScene() {
  return createWorld();
}
