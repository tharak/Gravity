import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";

export function recordTrails(world, maxTrailLength) {
  for (const entity of queryEntities(world, [Component.Position, Component.OrbitTrail])) {
    const position = getComponent(world, entity, Component.Position);
    const trail = getComponent(world, entity, Component.OrbitTrail).points;

    trail.push({ x: position.x, y: position.y });
    if (trail.length > maxTrailLength) {
      trail.splice(0, trail.length - maxTrailLength);
    }
  }
}
