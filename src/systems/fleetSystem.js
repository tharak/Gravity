import { FleetFormation, FleetModelConfig } from "../config/fleetConfig.js";
import { add, clamp01, clampMagnitude, length, normalizeAngle, rotate, scale, subtract, vec2 } from "../core/vector.js";
import { Component } from "../ecs/components.js";
import { addComponent, getComponent, queryEntities } from "../ecs/world.js";
import { SHIP_FACING_UP } from "../game/factory.js";
import { applyThrusterCommandToShip, createSeekThrusterCommand } from "../game/flightControl.js";
import { getFormationOffset } from "../game/formations.js";

export function applyFleetFormation(world, inputById, deltaSeconds = 0) {
  for (const [flagship, members] of groupMembersByFlagship(world)) {
    const flagshipPosition = getComponent(world, flagship, Component.Position);
    if (!flagshipPosition) {
      continue;
    }

    const formation = getFleetFormation(world, flagship, inputById);
    const formationHeading = updateFormationHeading(world, flagship, deltaSeconds);
    const flagshipVelocity = getComponent(world, flagship, Component.Velocity) ?? vec2();
    const fleetShips = [flagship, ...members.map((member) => member.entity)];

    for (const member of members) {
      steerFleetMember(world, member, {
        formation,
        formationHeading,
        flagshipPosition,
        flagshipVelocity,
        fleetShips
      }, deltaSeconds);
    }
  }
}

function steerFleetMember(world, member, fleet, deltaSeconds) {
  const position = getComponent(world, member.entity, Component.Position);
  const velocity = getComponent(world, member.entity, Component.Velocity) ?? vec2();
  const rotation = getComponent(world, member.entity, Component.Rotation)?.angle ?? SHIP_FACING_UP;
  const offset = getFormationOffset(fleet.formation, member.slotIndex, FleetModelConfig.spacing);
  const slot = add(fleet.flagshipPosition, rotate(offset.x, offset.y, fleet.formationHeading));
  const catchUp = clampMagnitude(
    scale(subtract(slot, position), FleetModelConfig.arrive.catchUpGain),
    FleetModelConfig.arrive.maxCatchUpSpeed
  );
  const separation = getSeparationPush(world, member, position, fleet.fleetShips);
  const avoidance = getAvoidancePush(world, member, position, velocity, fleet.fleetShips);
  const desiredVelocity = add(add(add(fleet.flagshipVelocity, catchUp), separation), avoidance);
  const velocityError = subtract(desiredVelocity, velocity);
  const errorSpeed = length(velocityError);
  const settled = errorSpeed <= FleetModelConfig.settleSpeedError;
  const seek = settled
    ? { directionX: 0, directionY: 0, power: 0, targetAngle: fleet.formationHeading }
    : {
      directionX: velocityError.x / errorSpeed,
      directionY: velocityError.y / errorSpeed,
      power: clamp01(errorSpeed / FleetModelConfig.speedErrorForFullThrottle),
      targetAngle: Math.atan2(velocityError.y, velocityError.x)
    };

  applyThrusterCommandToShip(world, member.entity, createSeekThrusterCommand(world, member.entity, seek, deltaSeconds), rotation);
}

function getSeparationPush(world, member, position, fleetShips) {
  const push = vec2();

  for (const other of fleetShips) {
    if (other === member.entity) {
      continue;
    }

    const otherPosition = getComponent(world, other, Component.Position);
    if (!otherPosition) {
      continue;
    }

    const offset = subtract(position, otherPosition);
    const distance = length(offset);
    if (distance >= FleetModelConfig.separation.radius) {
      continue;
    }

    const away = distance > 0 ? scale(offset, 1 / distance) : vec2(0, member.slotIndex % 2 === 0 ? 1 : -1);
    const strength = FleetModelConfig.separation.strength * (1 - distance / FleetModelConfig.separation.radius);
    push.x += away.x * strength;
    push.y += away.y * strength;
  }

  return push;
}

function getAvoidancePush(world, member, position, velocity, fleetShips) {
  const push = vec2();

  for (const other of fleetShips) {
    if (other === member.entity) {
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
    if (timeToClosest <= 0 || timeToClosest > FleetModelConfig.avoid.lookaheadSeconds) {
      continue;
    }

    const miss = add(relativePosition, scale(relativeVelocity, timeToClosest));
    const missDistance = length(miss);
    if (missDistance >= FleetModelConfig.avoid.clearance) {
      continue;
    }

    const away = missDistance > 0
      ? scale(miss, 1 / missDistance)
      : scale({ x: -relativeVelocity.y, y: relativeVelocity.x }, 1 / Math.sqrt(relativeSpeedSquared));
    const strength = FleetModelConfig.avoid.strength * (1 - missDistance / FleetModelConfig.avoid.clearance);
    push.x += away.x * strength;
    push.y += away.y * strength;
  }

  return push;
}

function updateFormationHeading(world, flagship, deltaSeconds) {
  const rotation = getComponent(world, flagship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
  const fleet = getComponent(world, flagship, Component.Fleet)
    ?? addComponent(world, flagship, Component.Fleet, { formationHeading: rotation });
  const blend = Math.min(1, FleetModelConfig.headingSmoothingRate * deltaSeconds);

  fleet.formationHeading = normalizeAngle(
    fleet.formationHeading + normalizeAngle(rotation - fleet.formationHeading) * blend
  );
  return fleet.formationHeading;
}

function getFleetFormation(world, flagship, inputById) {
  const player = getComponent(world, flagship, Component.PlayerControlled);
  const formation = player ? inputById[player.inputId]?.fleetFormation : undefined;
  return formation ?? FleetFormation.Column;
}

function groupMembersByFlagship(world) {
  const membersByFlagship = new Map();

  for (const entity of queryEntities(world, [Component.FleetMember, Component.Acceleration])) {
    const member = getComponent(world, entity, Component.FleetMember);
    const members = membersByFlagship.get(member.flagship) ?? [];
    members.push({ entity, slotIndex: member.slotIndex });
    membersByFlagship.set(member.flagship, members);
  }

  for (const members of membersByFlagship.values()) {
    members.sort((a, b) => a.slotIndex - b.slotIndex);
  }

  return membersByFlagship;
}
