import { Component, ThrusterSlot } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";

const AXIS_THRESHOLD = 0.25;

export function applyPlayerInput(world, inputById) {
  resetThrusterPower(world);

  for (const ship of queryEntities(world, [
    Component.Acceleration,
    Component.PlayerControlled
  ])) {
    const player = getComponent(world, ship, Component.PlayerControlled);
    const input = inputById[player.inputId];

    if (!input?.active) {
      continue;
    }

    const powerBySlot = mapInputToThrusterPower(input);
    applyThrustersToShip(world, ship, powerBySlot);
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

function applyThrustersToShip(world, ship, powerBySlot) {
  const acceleration = getComponent(world, ship, Component.Acceleration);

  for (const thrusterEntity of queryEntities(world, [Component.Thruster])) {
    const thruster = getComponent(world, thrusterEntity, Component.Thruster);
    if (thruster.shipEntity !== ship) {
      continue;
    }

    const power = powerBySlot.get(thruster.slot) ?? 0;
    thruster.power = power;
    acceleration.x += thruster.directionX * thruster.maxAcceleration * power;
    acceleration.y += thruster.directionY * thruster.maxAcceleration * power;
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

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
