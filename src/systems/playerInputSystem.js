import { Component, ThrusterSlot } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { SHIP_FACING_UP } from "../game/factory.js";

const AXIS_THRESHOLD = 0.25;
const STABILIZE_SPEED = 180;
const STOP_EPSILON = 2;

export function applyPlayerInput(world, inputById) {
  resetThrusterPower(world);

  for (const ship of queryEntities(world, [Component.Acceleration, Component.PlayerControlled])) {
    const player = getComponent(world, ship, Component.PlayerControlled);
    const input = inputById[player.inputId];

    if (!input) {
      continue;
    }

    const command = input.active ? createManualCommand(input) : createStabilizeCommand(world, ship);
    if (command.strength <= 0) {
      continue;
    }

    const rotation = getComponent(world, ship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
    const referenceRotation = input.alignWithShip ? rotation : SHIP_FACING_UP;
    const localCommand = worldToLocal(command, referenceRotation);
    const powerBySlot = mapInputToThrusterPower(localCommand);
    applyThrustersToShip(world, ship, powerBySlot, rotation);
  }
}

export function mapInputToThrusterPower(input) {
  const power = clamp01(input.strength);
  const powerBySlot = new Map();

  if (input.x > AXIS_THRESHOLD) {
    powerBySlot.set(ThrusterSlot.MainBack, power);
  } else if (input.x < -AXIS_THRESHOLD) {
    powerBySlot.set(ThrusterSlot.FrontLeft, power);
    powerBySlot.set(ThrusterSlot.FrontRight, power);
  }

  if (input.y < -AXIS_THRESHOLD) {
    setSideThrusterPower(powerBySlot, input.x, ThrusterSlot.BottomLeft, ThrusterSlot.BottomRight, power);
  } else if (input.y > AXIS_THRESHOLD) {
    setSideThrusterPower(powerBySlot, input.x, ThrusterSlot.TopLeft, ThrusterSlot.TopRight, power);
  }

  return powerBySlot;
}

function createManualCommand(input) {
  const invert = input.inverted ? -1 : 1;
  return {
    x: input.x * invert,
    y: input.y * invert,
    strength: clamp01(input.strength)
  };
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

function setSideThrusterPower(powerBySlot, inputX, leftSlot, rightSlot, power) {
  if (inputX < -AXIS_THRESHOLD) {
    powerBySlot.set(leftSlot, power);
    return;
  }

  if (inputX > AXIS_THRESHOLD) {
    powerBySlot.set(rightSlot, power);
    return;
  }

  powerBySlot.set(leftSlot, power);
  powerBySlot.set(rightSlot, power);
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

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
