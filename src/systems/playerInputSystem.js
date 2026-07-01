import { Component, ThrusterSlot } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { SHIP_FACING_UP } from "../game/factory.js";

const STABILIZE_SPEED = 180;
const STOP_EPSILON = 2;
const FULL_CIRCLE = Math.PI * 2;
const THIRTY_DEGREES = Math.PI / 6;
const SIXTY_DEGREES = Math.PI / 3;

export function applyPlayerInput(world, inputById) {
  resetThrusterPower(world);

  for (const ship of queryEntities(world, [Component.Acceleration, Component.PlayerControlled])) {
    const player = getComponent(world, ship, Component.PlayerControlled);
    const input = inputById[player.inputId];

    if (!input) {
      continue;
    }

    const rotation = getComponent(world, ship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
    const command = input.active ? createManualCommand(input) : createStabilizeCommand(world, ship);
    const localCommand = worldToLocal(command, SHIP_FACING_UP);
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

  if (angle >= FULL_CIRCLE - THIRTY_DEGREES || angle < THIRTY_DEGREES) {
    return [ThrusterSlot.MainBack];
  }
  if (angle < SIXTY_DEGREES) {
    return [ThrusterSlot.BottomRight];
  }
  if (angle < Math.PI - SIXTY_DEGREES) {
    return [ThrusterSlot.BottomLeft, ThrusterSlot.BottomRight];
  }
  if (angle < Math.PI - THIRTY_DEGREES) {
    return [ThrusterSlot.BottomLeft];
  }
  if (angle < Math.PI + THIRTY_DEGREES) {
    return [ThrusterSlot.FrontLeft, ThrusterSlot.FrontRight];
  }
  if (angle < Math.PI + SIXTY_DEGREES) {
    return [ThrusterSlot.TopLeft];
  }
  if (angle < FULL_CIRCLE - SIXTY_DEGREES) {
    return [ThrusterSlot.TopLeft, ThrusterSlot.TopRight];
  }
  return [ThrusterSlot.TopRight];
}

function createManualCommand(input) {
  return { x: input.x, y: input.y, strength: clamp01(input.strength) };
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


function normalizeAngle(angle) {
  return (angle + FULL_CIRCLE) % FULL_CIRCLE;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
