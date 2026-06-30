import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { vec2 } from "../core/vector.js";

export function applyGravity(world, config) {
  const bodies = queryEntities(world, [Component.Position, Component.Velocity, Component.Mass]);
  const accelerations = new Map(bodies.map((entity) => [entity, vec2()]));
  const gravitationalConstant = config.gravitationalConstant;
  const softeningSquared = config.softening * config.softening;

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i];
      const b = bodies[j];
      const positionA = getComponent(world, a, Component.Position);
      const positionB = getComponent(world, b, Component.Position);
      const massA = getComponent(world, a, Component.Mass).value;
      const massB = getComponent(world, b, Component.Mass).value;

      const dx = positionB.x - positionA.x;
      const dy = positionB.y - positionA.y;
      const distanceSquared = dx * dx + dy * dy + softeningSquared;
      const distance = Math.sqrt(distanceSquared);
      const inverseDistanceCubed = 1 / (distanceSquared * distance);

      const forceX = gravitationalConstant * dx * inverseDistanceCubed;
      const forceY = gravitationalConstant * dy * inverseDistanceCubed;

      const accelerationA = accelerations.get(a);
      accelerationA.x += forceX * massB;
      accelerationA.y += forceY * massB;

      const accelerationB = accelerations.get(b);
      accelerationB.x -= forceX * massA;
      accelerationB.y -= forceY * massA;
    }
  }

  for (const [entity, acceleration] of accelerations) {
    getComponent(world, entity, Component.Acceleration).x = acceleration.x;
    getComponent(world, entity, Component.Acceleration).y = acceleration.y;
  }
}
