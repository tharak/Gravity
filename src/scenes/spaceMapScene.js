import { LabelConfig } from "../config/labelConfig.js";
import { SpaceMapModelConfig } from "../config/spaceMapConfig.js";
import { createWorld } from "../ecs/world.js";
import { generateSpaceMap } from "../game/spaceMap.js";

export const SpaceMapScene = Object.freeze({
  id: "SpaceMap",
  label: LabelConfig.maps.SpaceMap,
  hidesCockpit: true
});

export function createSpaceMapScene() {
  const world = createWorld();
  world.spaceMap = generateSpaceMap(SpaceMapModelConfig);
  return world;
}
