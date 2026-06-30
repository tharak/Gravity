import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { vec2 } from "../core/vector.js";

export function applyGravity(world, config) {
  const sources = queryEntities(world, [Component.Position, Component.Mass]);
  const affectedBodies = queryEntities(world, [
    Component.Position,
    Component.Velocity,
    Component.Acceleration,
    Component.Mass
  ]).filter((entity) => getComponent(world, entity, Component.StaticBody) === undefined);

  const accelerations = new Map(affectedBodies.map((entity) => [entity, vec2()]));
  const gravitationalConstant = config.gravitationalConstant;
  const softeningSquared = config.softening * config.softening;

  for (const affected of affectedBodies) {
    const affectedPosition = getComponent(world, affected, Component.Position);

    for (const source of sources) {
      if (source === affected) {
        continue;
      }

      const sourcePosition = getComponent(world, source, Component.Position);
      const sourceMass = getComponent(world, source, Component.Mass).value;
      const dx = sourcePosition.x - affectedPosition.x;
      const dy = sourcePosition.y - affectedPosition.y;
      const distanceSquared = dx * dx + dy * dy + softeningSquared;
      const distance = Math.sqrt(distanceSquared);
      const inverseDistanceCubed = 1 / (distanceSquared * distance);
      const acceleration = accelerations.get(affected);

      acceleration.x += gravitationalConstant * sourceMass * dx * inverseDistanceCubed;
      acceleration.y += gravitationalConstant * sourceMass * dy * inverseDistanceCubed;
    }
  }

  for (const [entity, acceleration] of accelerations) {
    getComponent(world, entity, Component.Acceleration).x = acceleration.x;
    getComponent(world, entity, Component.Acceleration).y = acceleration.y;
  }
}
