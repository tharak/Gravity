import { EnemyAiConfig } from "../config/enemyConfig.js";
import { add, clamp01, clampMagnitude, length, scale, subtract, vec2 } from "../core/vector.js";
import { BodyKind, Component } from "../ecs/components.js";
import { getComponent, getComponents, queryEntities } from "../ecs/world.js";
import { SHIP_FACING_UP } from "../game/factory.js";
import { applyThrusterCommandToShip, createSeekThrusterCommand } from "../game/flightControl.js";
import { getShipGuns } from "../game/shipParts.js";
import { getArenaLimitedVelocity, getAvoidancePush, getSeparationPush } from "../game/steering.js";
import { findNearestOpposingShip } from "../game/targeting.js";

export function applyEnemyAi(world, deltaSeconds = 0) {
  const allShips = getAllShips(world);

  for (const ship of getIndependentCombatShips(world)) {
    steerCombatShip(world, ship, allShips, deltaSeconds);
  }
}

function steerCombatShip(world, ship, allShips, deltaSeconds) {
  const position = getComponent(world, ship, Component.Position);
  const velocity = getComponent(world, ship, Component.Velocity) ?? vec2();
  const rotation = getComponent(world, ship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
  const faction = getComponent(world, ship, Component.Faction).id;
  const target = findNearestOpposingShip(world, ship, position);
  const squad = allShips.filter((other) => getComponent(world, other, Component.Faction)?.id === faction);

  const pursuit = target ? getPursuitVelocity(world, ship, position, target) : vec2();
  const separation = getSeparationPush(world, ship, position, squad, EnemyAiConfig.separation);
  const avoidance = getAvoidancePush(world, ship, position, velocity, allShips, EnemyAiConfig.avoid);
  const desiredVelocity = getArenaLimitedVelocity(
    position,
    add(add(pursuit, separation), avoidance),
    world.arena,
    EnemyAiConfig.arena
  );
  const velocityError = subtract(desiredVelocity, velocity);
  const errorSpeed = length(velocityError);
  const settled = errorSpeed <= EnemyAiConfig.settleSpeedError;
  const needsMainBurn = errorSpeed > EnemyAiConfig.noseAlignmentSpeedError;
  const facingAngle = target ? Math.atan2(target.y - position.y, target.x - position.x) : rotation;
  const seek = settled
    ? { directionX: 0, directionY: 0, power: 0, targetAngle: facingAngle }
    : {
      directionX: velocityError.x / errorSpeed,
      directionY: velocityError.y / errorSpeed,
      power: clamp01(errorSpeed / EnemyAiConfig.speedErrorForFullThrottle),
      targetAngle: needsMainBurn ? Math.atan2(velocityError.y, velocityError.x) : facingAngle
    };

  applyThrusterCommandToShip(world, ship, createSeekThrusterCommand(world, ship, seek, deltaSeconds), rotation);
}

function getPursuitVelocity(world, ship, position, target) {
  const targetVelocity = getComponent(world, target.entity, Component.Velocity) ?? vec2();
  const standoff = getStandoffDistance(world, ship);
  const toTarget = subtract({ x: target.x, y: target.y }, position);
  const distance = length(toTarget);
  if (distance === 0) {
    return targetVelocity;
  }

  const approach = clampMagnitude(
    scale(scale(toTarget, 1 / distance), (distance - standoff) * EnemyAiConfig.approachGain),
    EnemyAiConfig.maxApproachSpeed
  );
  return add(targetVelocity, approach);
}

function getStandoffDistance(world, ship) {
  const range = getShipGuns(world, ship)[0]?.range ?? EnemyAiConfig.fallbackRange;
  return range * EnemyAiConfig.standoffRangeRatio;
}

function getIndependentCombatShips(world) {
  return queryEntities(world, [Component.Faction, Component.Acceleration, Component.Position])
    .filter((ship) => getComponent(world, ship, Component.PlayerControlled) === undefined
      && getComponent(world, ship, Component.FleetMember) === undefined);
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
