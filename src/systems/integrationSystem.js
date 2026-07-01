import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";

export function integrateMotion(world, deltaSeconds) {
  const movingEntities = queryEntities(world, [
    Component.Position,
    Component.Velocity,
    Component.Acceleration
  ]).filter((entity) => getComponent(world, entity, Component.StaticBody) === undefined);

  for (const entity of movingEntities) {
    const position = getComponent(world, entity, Component.Position);
    const velocity = getComponent(world, entity, Component.Velocity);
    const acceleration = getComponent(world, entity, Component.Acceleration);

    velocity.x += acceleration.x * deltaSeconds;
    velocity.y += acceleration.y * deltaSeconds;
    position.x += velocity.x * deltaSeconds;
    position.y += velocity.y * deltaSeconds;

    integrateRotation(world, entity, deltaSeconds);
  }

  world.time += deltaSeconds;
}

function integrateRotation(world, entity, deltaSeconds) {
  const rotation = getComponent(world, entity, Component.Rotation);
  const angularVelocity = getComponent(world, entity, Component.AngularVelocity);
  const angularAcceleration = getComponent(world, entity, Component.AngularAcceleration);

  if (!rotation || !angularVelocity || !angularAcceleration) {
    return;
  }

  angularVelocity.value += angularAcceleration.value * deltaSeconds;
  rotation.angle += angularVelocity.value * deltaSeconds;
}
