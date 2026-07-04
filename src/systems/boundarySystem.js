import { BodyKind, Component } from "../ecs/components.js";
import { getComponent, getComponents } from "../ecs/world.js";

export function applyWorldBoundary(world) {
  const arena = world.arena;
  if (!arena) {
    return;
  }

  for (const [entity, bodyKind] of getComponents(world, Component.BodyKind)) {
    if (bodyKind.value !== BodyKind.Ship) {
      continue;
    }

    const position = getComponent(world, entity, Component.Position);
    const health = getComponent(world, entity, Component.Health);
    if (!position || !health) {
      continue;
    }

    if (position.x < arena.minX || position.x > arena.maxX || position.y < arena.minY || position.y > arena.maxY) {
      health.current = 0;
    }
  }
}
