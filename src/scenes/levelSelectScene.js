import { createWorld } from "../ecs/world.js";

export const LevelSelectScene = Object.freeze({
  id: "LevelSelect",
  label: "Level Select",
  isMenu: true
});

export function createLevelSelectScene() {
  return createWorld();
}
