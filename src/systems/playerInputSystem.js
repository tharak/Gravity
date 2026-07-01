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
    const command = input.active
      ? createManualThrusterCommand(input)
      : createStabilizeThrusterCommand(world, ship, rotation);

    applyThrusterCommandToShip(world, ship, command, rotation);
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

function createManualThrusterCommand(input) {
  const command = { x: input.x, y: input.y, strength: clamp01(input.strength) };
  return createThrusterCommand(mapInputToThrusterPower(worldToLocal(command, SHIP_FACING_UP)), false);
}

function createStabilizeThrusterCommand(world, ship, rotation) {
  const velocity = getComponent(world, ship, Component.Velocity);
  const powerBySlot = new Map();
  if (!velocity) {
    return createThrusterCommand(powerBySlot, true);
  }

  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed < STOP_EPSILON) {
    velocity.x = 0;
    velocity.y = 0;
    return createThrusterCommand(powerBySlot, true);
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

  return createThrusterCommand(powerBySlot, true);
}

function createThrusterCommand(powerBySlot, stabilizing) {
  return { powerBySlot, stabilizing };
}

function applyThrusterCommandToShip(world, ship, command, rotation) {
  const acceleration = getComponent(world, ship, Component.Acceleration);
  const angularAcceleration = getComponent(world, ship, Component.AngularAcceleration);
  const mass = getComponent(world, ship, Component.Mass);
  const momentOfInertia = getComponent(world, ship, Component.MomentOfInertia);
  if (angularAcceleration) {
    angularAcceleration.value = 0;
  }

  for (const thrusterEntity of queryEntities(world, [Component.Thruster])) {
    const thruster = getComponent(world, thrusterEntity, Component.Thruster);
    if (thruster.shipEntity !== ship) {
      continue;
    }

    const power = command.powerBySlot.get(thruster.slot) ?? 0;
    const direction = localToWorld(thruster, rotation);
    const force = {
      x: direction.x * thruster.maxAcceleration * power,
      y: direction.y * thruster.maxAcceleration * power
    };
    thruster.power = power;
    thruster.stabilizing = command.stabilizing && power > 0;
    acceleration.x += force.x;
    acceleration.y += force.y;

    if (angularAcceleration && mass && momentOfInertia) {
      const offset = rotatePoint(thruster.localX, thruster.localY, rotation);
      const worldForce = { x: force.x * mass.value, y: force.y * mass.value };
      angularAcceleration.value += cross2(offset, worldForce) / momentOfInertia.value;
    }
  }
}

function resetThrusterPower(world) {
  for (const thrusterEntity of queryEntities(world, [Component.Thruster])) {
    const thruster = getComponent(world, thrusterEntity, Component.Thruster);
    thruster.power = 0;
    thruster.stabilizing = false;
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

function rotatePoint(x, y, rotation) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos
  };
}

function cross2(a, b) {
  return a.x * b.y - a.y * b.x;
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
