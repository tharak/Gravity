import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";

export function integrateMotion(world, deltaSeconds) {
  const movingEntities = queryEntities(world, [
    Component.Position,
    Component.Velocity,
    Component.Acceleration
  ]);

  for (const entity of movingEntities) {
    const position = getComponent(world, entity, Component.Position);
    const velocity = getComponent(world, entity, Component.Velocity);
    const acceleration = getComponent(world, entity, Component.Acceleration);

    velocity.x += acceleration.x * deltaSeconds;
    velocity.y += acceleration.y * deltaSeconds;
    position.x += velocity.x * deltaSeconds;
    position.y += velocity.y * deltaSeconds;
  }

  world.time += deltaSeconds;
}
