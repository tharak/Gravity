import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";

export function resolveCollisions(world) {
  const bodies = queryEntities(world, [
    Component.Position,
    Component.Velocity,
    Component.Radius,
    Component.Mass
  ]).filter((entity) => getComponent(world, entity, Component.StaticBody) === undefined);

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      resolvePair(world, bodies[i], bodies[j]);
    }
  }
}

function resolvePair(world, a, b) {
  const positionA = getComponent(world, a, Component.Position);
  const positionB = getComponent(world, b, Component.Position);
  const velocityA = getComponent(world, a, Component.Velocity);
  const velocityB = getComponent(world, b, Component.Velocity);
  const radiusA = getComponent(world, a, Component.Radius).value;
  const radiusB = getComponent(world, b, Component.Radius).value;
  const massA = getComponent(world, a, Component.Mass).value;
  const massB = getComponent(world, b, Component.Mass).value;

  let dx = positionB.x - positionA.x;
  let dy = positionB.y - positionA.y;
  let distance = Math.hypot(dx, dy);
  const minDistance = radiusA + radiusB;

  if (distance >= minDistance) {
    return;
  }

  if (distance === 0) {
    dx = 1;
    dy = 0;
    distance = 1;
  }

  const normalX = dx / distance;
  const normalY = dy / distance;
  const overlap = minDistance - distance;
  const totalMass = massA + massB;

  positionA.x -= normalX * overlap * (massB / totalMass);
  positionA.y -= normalY * overlap * (massB / totalMass);
  positionB.x += normalX * overlap * (massA / totalMass);
  positionB.y += normalY * overlap * (massA / totalMass);

  const relativeVelocityX = velocityB.x - velocityA.x;
  const relativeVelocityY = velocityB.y - velocityA.y;
  const normalSpeed = relativeVelocityX * normalX + relativeVelocityY * normalY;
  if (normalSpeed > 0) {
    return;
  }

  const restitution = 0.45;
  const impulse = (-(1 + restitution) * normalSpeed) / (1 / massA + 1 / massB);
  const impulseX = impulse * normalX;
  const impulseY = impulse * normalY;

  velocityA.x -= impulseX / massA;
  velocityA.y -= impulseY / massA;
  velocityB.x += impulseX / massB;
  velocityB.y += impulseY / massB;
}
