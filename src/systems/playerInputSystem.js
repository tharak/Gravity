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
    const powerBySlot = input.active
      ? createManualThrusterPower(input)
      : createStabilizeThrusterPower(world, ship, rotation);

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

function createManualThrusterPower(input) {
  const command = { x: input.x, y: input.y, strength: clamp01(input.strength) };
  return mapInputToThrusterPower(worldToLocal(command, SHIP_FACING_UP));
}

function createStabilizeThrusterPower(world, ship, rotation) {
  const velocity = getComponent(world, ship, Component.Velocity);
  const powerBySlot = new Map();
  if (!velocity) {
    return powerBySlot;
  }

  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed < STOP_EPSILON) {
    velocity.x = 0;
    velocity.y = 0;
    return powerBySlot;
  }

  const desiredDirection = {
    x: -velocity.x / speed,
    y: -velocity.y / speed
  };
  const basePower = clamp01(speed / STABILIZE_SPEED);

  for (const thrusterEntity of queryEntities(world, [Component.Thruster])) {
    const thruster = getComponent(world, thrusterEntity, Component.Thruster);
    if (thruster.shipEntity !== ship) {
      continue;
    }

    const direction = localToWorld(thruster, rotation);
    const alignment = direction.x * desiredDirection.x + direction.y * desiredDirection.y;
    if (alignment > 0) {
      powerBySlot.set(thruster.slot, basePower * alignment);
    }
  }

  return powerBySlot;
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
