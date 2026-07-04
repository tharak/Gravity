import { FleetFormation, FleetModelConfig } from "../config/fleetConfig.js";
import { add, clamp01, clampMagnitude, length, normalizeAngle, rotate, scale, subtract, vec2 } from "../core/vector.js";
import { BodyKind, Component } from "../ecs/components.js";
import { addComponent, getComponent, getComponents, queryEntities } from "../ecs/world.js";
import { SHIP_FACING_UP } from "../game/factory.js";
import { applyThrusterCommandToShip, createSeekThrusterCommand } from "../game/flightControl.js";
import { getFormationOffset } from "../game/formations.js";
import { getAvoidancePush, getSeparationPush } from "../game/steering.js";

export function applyFleetFormation(world, inputById, deltaSeconds = 0) {
  const allShips = getAllShips(world);

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
        fleetShips,
        allShips
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
  const separation = getSeparationPush(world, member.entity, position, fleet.fleetShips, FleetModelConfig.separation);
  const avoidance = getAvoidancePush(world, member.entity, position, velocity, fleet.allShips, FleetModelConfig.avoid);
  const desiredVelocity = add(add(add(fleet.flagshipVelocity, catchUp), separation), avoidance);
  const velocityError = subtract(desiredVelocity, velocity);
  const errorSpeed = length(velocityError);
  const settled = errorSpeed <= FleetModelConfig.settleSpeedError;
  const needsMainBurn = errorSpeed > FleetModelConfig.noseAlignmentSpeedError;
  const seek = settled
    ? { directionX: 0, directionY: 0, power: 0, targetAngle: fleet.formationHeading }
    : {
      directionX: velocityError.x / errorSpeed,
      directionY: velocityError.y / errorSpeed,
      power: clamp01(errorSpeed / FleetModelConfig.speedErrorForFullThrottle),
      targetAngle: needsMainBurn ? Math.atan2(velocityError.y, velocityError.x) : fleet.formationHeading
    };

  applyThrusterCommandToShip(world, member.entity, createSeekThrusterCommand(world, member.entity, seek, deltaSeconds), rotation);
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
  const formation = player
    ? inputById[player.inputId]?.fleetFormation
    : getComponent(world, flagship, Component.Fleet)?.formation;
  return formation ?? FleetFormation.Column;
}

function getAllShips(world) {
  const ships = [];
  for (const [entity, bodyKind] of getComponents(world, Component.BodyKind)) {
    if (bodyKind.value === BodyKind.Ship) {
      ships.push(entity);
    }
  }
  return ships;
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
