import { Component } from "../ecs/components.js";
import { getComponents } from "../ecs/world.js";

export function getWorldBounds(world) {
  const positions = getComponents(world, Component.Position);
  if (positions.size === 0) {
    return undefined;
  }

  const radii = getComponents(world, Component.Radius);
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const [entity, position] of positions) {
    const radius = radii.get(entity)?.value ?? 0;
    bounds.minX = Math.min(bounds.minX, position.x - radius);
    bounds.minY = Math.min(bounds.minY, position.y - radius);
    bounds.maxX = Math.max(bounds.maxX, position.x + radius);
    bounds.maxY = Math.max(bounds.maxY, position.y + radius);
  }

  return bounds;
}
