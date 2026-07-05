import { add, length, scale, subtract, vec2 } from "../core/vector.js";
import { Component } from "../ecs/components.js";
import { getComponent } from "../ecs/world.js";

export function getSeparationPush(world, entity, position, ships, separation) {
  const push = vec2();

  for (const other of ships) {
    if (other === entity) {
      continue;
    }

    const otherPosition = getComponent(world, other, Component.Position);
    if (!otherPosition) {
      continue;
    }

    const offset = subtract(position, otherPosition);
    const distance = length(offset);
    if (distance >= separation.radius) {
      continue;
    }

    const away = distance > 0 ? scale(offset, 1 / distance) : vec2(0, entity % 2 === 0 ? 1 : -1);
    const strength = separation.strength * (1 - distance / separation.radius);
    push.x += away.x * strength;
    push.y += away.y * strength;
  }

  return push;
}

export function getArenaLimitedVelocity(position, desired, arena, config) {
  if (!arena) {
    return desired;
  }

  return {
    x: clampAxis(desired.x, position.x, arena.minX, arena.maxX, config),
    y: clampAxis(desired.y, position.y, arena.minY, arena.maxY, config)
  };
}

function clampAxis(desired, position, min, max, config) {
  const towardMax = brakeableSpeed(max - config.margin - position, config);
  const towardMin = -brakeableSpeed(position - (min + config.margin), config);
  return Math.min(Math.max(desired, towardMin), towardMax);
}

function brakeableSpeed(distance, config) {
  const speed = Math.sqrt(2 * config.brakingAcceleration * Math.abs(distance));
  return distance >= 0 ? speed : -speed;
}

export function getAvoidancePush(world, entity, position, velocity, ships, avoid) {
  const push = vec2();

  for (const other of ships) {
    if (other === entity) {
      continue;
    }

    const otherPosition = getComponent(world, other, Component.Position);
    if (!otherPosition) {
      continue;
    }

    const otherVelocity = getComponent(world, other, Component.Velocity) ?? vec2();
    const relativePosition = subtract(position, otherPosition);
    const relativeVelocity = subtract(velocity, otherVelocity);
    const relativeSpeedSquared = relativeVelocity.x * relativeVelocity.x + relativeVelocity.y * relativeVelocity.y;
    if (relativeSpeedSquared === 0) {
      continue;
    }

    const timeToClosest = -(relativePosition.x * relativeVelocity.x + relativePosition.y * relativeVelocity.y)
      / relativeSpeedSquared;
    if (timeToClosest <= 0 || timeToClosest > avoid.lookaheadSeconds) {
      continue;
    }

    const miss = add(relativePosition, scale(relativeVelocity, timeToClosest));
    const missDistance = length(miss);
    if (missDistance >= avoid.clearance) {
      continue;
    }

    const away = missDistance > 0
      ? scale(miss, 1 / missDistance)
      : scale({ x: -relativeVelocity.y, y: relativeVelocity.x }, 1 / Math.sqrt(relativeSpeedSquared));
    const strength = avoid.strength * (1 - missDistance / avoid.clearance);
    push.x += away.x * strength;
    push.y += away.y * strength;
  }

  return push;
}
