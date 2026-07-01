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

    const rotation = getComponent(world, ship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
    const referenceRotation = input.alignWithShip ? rotation : SHIP_FACING_UP;
    const powerBySlot = input.active
      ? mapManualInputToThrusterPower(worldToLocal(createManualCommand(input), referenceRotation), input.sideControls)
      : mapStabilizeInputToThrusterPower(worldToLocal(createStabilizeCommand(world, ship), referenceRotation));

    applyThrustersToShip(world, ship, powerBySlot, rotation);
  }
}

export function mapManualInputToThrusterPower(input, sideControls = {}) {
  const powerBySlot = mapMainThrusterPower(input);
  addSideControlPower(powerBySlot, ThrusterSlot.TopLeft, ThrusterSlot.TopRight, sideControls.top);
  addSideControlPower(powerBySlot, ThrusterSlot.BottomLeft, ThrusterSlot.BottomRight, sideControls.bottom);
  return powerBySlot;
}

export function mapStabilizeInputToThrusterPower(input) {
  const power = clamp01(input.strength);
  const powerBySlot = mapMainThrusterPower(input);

  if (input.y < -AXIS_THRESHOLD) {
    powerBySlot.set(ThrusterSlot.BottomLeft, power);
    powerBySlot.set(ThrusterSlot.BottomRight, power);
  } else if (input.y > AXIS_THRESHOLD) {
    powerBySlot.set(ThrusterSlot.TopLeft, power);
    powerBySlot.set(ThrusterSlot.TopRight, power);
  }

  return powerBySlot;
}

function mapMainThrusterPower(input) {
  const power = clamp01(input.strength);
  const powerBySlot = new Map();

  if (input.x > AXIS_THRESHOLD) {
    powerBySlot.set(ThrusterSlot.MainBack, power);
  } else if (input.x < -AXIS_THRESHOLD) {
    powerBySlot.set(ThrusterSlot.FrontLeft, power);
    powerBySlot.set(ThrusterSlot.FrontRight, power);
  }

  return powerBySlot;
}

function addSideControlPower(powerBySlot, leftSlot, rightSlot, control) {
  if (!control?.active || control.strength <= 0) {
    return;
  }

  const power = clamp01(control.strength);
  powerBySlot.set(leftSlot, power);
  powerBySlot.set(rightSlot, power);
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
