import { CollisionConfig } from "../config/collisionConfig.js";
import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { applyDamage } from "../game/damage.js";

export function resolveCollisions(world) {
  const bodies = queryEntities(world, [
    Component.Position,
    Component.Radius,
    Component.Mass
  ]).filter((entity) => getComponent(world, entity, Component.Projectile) === undefined
    && (getComponent(world, entity, Component.Velocity) !== undefined || getComponent(world, entity, Component.StaticBody) !== undefined));

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
  const inverseMassA = getInverseCollisionMass(world, a, massA);
  const inverseMassB = getInverseCollisionMass(world, b, massB);
  const totalInverseMass = inverseMassA + inverseMassB;

  if (totalInverseMass <= 0) {
    return;
  }

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

  positionA.x -= normalX * overlap * (inverseMassA / totalInverseMass);
  positionA.y -= normalY * overlap * (inverseMassA / totalInverseMass);
  positionB.x += normalX * overlap * (inverseMassB / totalInverseMass);
  positionB.y += normalY * overlap * (inverseMassB / totalInverseMass);

  const relativeVelocityX = (velocityB?.x ?? 0) - (velocityA?.x ?? 0);
  const relativeVelocityY = (velocityB?.y ?? 0) - (velocityA?.y ?? 0);
  const normalSpeed = relativeVelocityX * normalX + relativeVelocityY * normalY;
  if (normalSpeed > 0) {
    return;
  }

  applyCollisionDamage(world, a, b, -normalSpeed);

  const restitution = CollisionConfig.restitution;
  const impulse = (-(1 + restitution) * normalSpeed) / totalInverseMass;
  const impulseX = impulse * normalX;
  const impulseY = impulse * normalY;

  if (velocityA) {
    velocityA.x -= impulseX * inverseMassA;
    velocityA.y -= impulseY * inverseMassA;
  }
  if (velocityB) {
    velocityB.x += impulseX * inverseMassB;
    velocityB.y += impulseY * inverseMassB;
  }
}

function getInverseCollisionMass(world, entity, mass) {
  if (getComponent(world, entity, Component.StaticBody) !== undefined) {
    return 0;
  }

  return mass > 0 ? 1 / mass : 0;
}

function applyCollisionDamage(world, a, b, closingSpeed) {
  const damage = Math.max(0, closingSpeed - CollisionConfig.damageThreshold) * CollisionConfig.damageScale;
  if (damage <= 0) {
    return;
  }

  applyDamage(world, a, damage);
  applyDamage(world, b, damage);
}
