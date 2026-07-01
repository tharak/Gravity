import { Component, ThrusterSlot } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { SHIP_FACING_UP } from "../game/factory.js";

const STABILIZE_SPEED = 180;
const STOP_EPSILON = 2;
const FULL_CIRCLE = Math.PI * 2;

export function applyPlayerInput(world, inputById) {
  resetThrusterPower(world);

  for (const ship of queryEntities(world, [Component.Acceleration, Component.PlayerControlled])) {
    const player = getComponent(world, ship, Component.PlayerControlled);
    const input = inputById[player.inputId];

    if (!input) {
      continue;
    }

    const rotation = getComponent(world, ship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
    const referenceRotation = input.alignWithShip ? rotation : SHIP_FACING_UP;
    const command = input.active ? createManualCommand(input) : createStabilizeCommand(world, ship);
    const localCommand = worldToLocal(command, referenceRotation);
    const powerBySlot = mapInputToThrusterPower(localCommand);

    applyThrustersToShip(world, ship, powerBySlot, rotation);
  }
}

export function mapInputToThrusterPower(input) {
  const power = clamp01(input.strength);
  const powerBySlot = new Map();
  if (power <= 0) {
    return powerBySlot;
  }

  for (const slot of getSectorSlots(input.x, input.y)) {
    powerBySlot.set(slot, power);
  }
  return powerBySlot;
}

export function getSectorSlots(x, y) {
  const angle = normalizeAngle(Math.atan2(y, x));
  const sector = Math.round(angle / (Math.PI / 4)) % 8;

  switch (sector) {
    case 0:
      return [ThrusterSlot.MainBack];
    case 1:
      return [ThrusterSlot.TopRight];
    case 2:
      return [ThrusterSlot.TopRight, ThrusterSlot.BottomRight];
    case 3:
      return [ThrusterSlot.BottomRight];
    case 4:
      return [ThrusterSlot.FrontLeft, ThrusterSlot.FrontRight];
    case 5:
      return [ThrusterSlot.BottomLeft];
    case 6:
      return [ThrusterSlot.TopLeft, ThrusterSlot.BottomLeft];
    case 7:
      return [ThrusterSlot.TopLeft];
    default:
      return [];
  }
}

function createManualCommand(input) {
  const rotation = input.inverted ? Math.PI : 0;
  return rotateVector({ x: input.x, y: input.y, strength: clamp01(input.strength) }, rotation);
}

function createStabilizeCommand(world, ship) {
  const velocity = getComponent(world, ship, Component.Velocity);
  if (!velocity) {
    return { x: 0, y: 0, strength: 0 };
  }

  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed < STOP_EPSILON) {
    velocity.x = 0;
    velocity.y = 0;
    return { x: 0, y: 0, strength: 0 };
  }

  return {
    x: -velocity.x / speed,
    y: -velocity.y / speed,
    strength: clamp01(speed / STABILIZE_SPEED)
  };
}

function applyThrustersToShip(world, ship, powerBySlot, rotation) {
  const acceleration = getComponent(world, ship, Component.Acceleration);

  for (const thrusterEntity of queryEntities(world, [Component.Thruster])) {
    const thruster = getComponent(world, thrusterEntity, Component.Thruster);
    if (thruster.shipEntity !== ship) {
      continue;
    }

    const power = powerBySlot.get(thruster.slot) ?? 0;
    const direction = localToWorld(thruster, rotation);
    thruster.power = power;
    acceleration.x += direction.x * thruster.maxAcceleration * power;
    acceleration.y += direction.y * thruster.maxAcceleration * power;
  }
}

function resetThrusterPower(world) {
  for (const thrusterEntity of queryEntities(world, [Component.Thruster])) {
    getComponent(world, thrusterEntity, Component.Thruster).power = 0;
  }
}

function worldToLocal(vector, rotation) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: vector.x * cos + vector.y * sin,
    y: -vector.x * sin + vector.y * cos,
    strength: vector.strength
  };
}

function localToWorld(vector, rotation) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: vector.directionX * cos - vector.directionY * sin,
    y: vector.directionX * sin + vector.directionY * cos
  };
}

function rotateVector(vector, rotation) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
    strength: vector.strength
  };
}

function normalizeAngle(angle) {
  return (angle + FULL_CIRCLE) % FULL_CIRCLE;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
