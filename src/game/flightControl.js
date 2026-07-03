import { FlightControlConfig } from "../config/flightControlConfig.js";
import { MaxSpeedLevel } from "../config/speedOrderConfig.js";
import { clamp, clamp01, cross, normalizeAngle, rotate } from "../core/vector.js";
import { Component, ThrusterSlot } from "../ecs/components.js";
import { getComponent, getComponents } from "../ecs/world.js";
import { SHIP_FACING_UP } from "./factory.js";
import { getShipThrusters } from "./shipParts.js";
import { ControllerMode, SpeedOrder } from "../input/playerInput.js";

export function createPilotThrusterCommand(world, ship, input, deltaSeconds) {
  const battery = getComponent(world, ship, Component.Battery);
  const thrusters = getShipThrusters(world, ship);

  rechargeBattery(battery, deltaSeconds);

  const command = input?.speedOrder === SpeedOrder.Stop
    ? createStopThrusterCommand(world, ship, input)
    : input?.controllerMode === ControllerMode.Automatic
      ? createAutomaticThrusterCommand(world, ship, input)
      : createManualThrusterCommand(input);
  const weightedCommand = setPowerConsumptionWeight(command, input?.powerConsumptionWeight ?? 1);

  return applyBatteryLimitToCommand(battery, thrusters, weightedCommand, deltaSeconds);
}

export function createSeekThrusterCommand(world, ship, seek, deltaSeconds) {
  const battery = getComponent(world, ship, Component.Battery);
  const thrusters = getShipThrusters(world, ship);

  rechargeBattery(battery, deltaSeconds);

  return applyBatteryLimitToCommand(battery, thrusters, buildSeekCommand(world, ship, seek), deltaSeconds);
}

function buildSeekCommand(world, ship, seek) {
  const powerBySlot = new Map();
  const rotation = getComponent(world, ship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
  const angularVelocity = getComponent(world, ship, Component.AngularVelocity)?.value ?? 0;
  const linearPower = clamp01(seek.power ?? 0);

  if (linearPower > 0) {
    for (const thruster of getShipThrusters(world, ship)) {
      const direction = localToWorld(thruster, rotation);
      const alignment = direction.x * seek.directionX + direction.y * seek.directionY;
      if (alignment > FlightControlConfig.stop.alignmentThreshold) {
        setSlotPower(powerBySlot, thruster.slot, alignment * linearPower);
      }
    }
  }

  addTurnStabilization(powerBySlot, seek.targetAngle, rotation, angularVelocity);
  return createThrusterCommand(powerBySlot, true);
}

function createManualThrusterCommand(input) {
  const powerBySlot = new Map();
  const requestedSpeed = clampSpeed(input?.speedLevel ?? 0);
  const activeSlots = input?.activeSlots ?? new Set();

  if (activeSlots.size === 0 || requestedSpeed <= 0) {
    return createThrusterCommand(powerBySlot, false);
  }

  for (const slot of activeSlots) {
    powerBySlot.set(slot, requestedSpeed);
  }

  return createThrusterCommand(powerBySlot, false);
}

function createStopThrusterCommand(world, ship, input) {
  const powerBySlot = new Map();
  const rotation = getComponent(world, ship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
  const velocity = getComponent(world, ship, Component.Velocity) ?? { x: 0, y: 0 };
  const angularVelocity = getComponent(world, ship, Component.AngularVelocity)?.value ?? 0;
  const speed = Math.hypot(velocity.x, velocity.y);
  const hasTargetHeading = input?.controllerMode === ControllerMode.Automatic && Number.isFinite(input?.targetAngle);

  if (speed > FlightControlConfig.stop.minLinearSpeed) {
    const desired = { x: -velocity.x / speed, y: -velocity.y / speed };
    const linearPower = clamp01(speed / FlightControlConfig.stop.fullPowerSpeed);
    for (const thruster of getShipThrusters(world, ship)) {
      const direction = localToWorld(thruster, rotation);
      const alignment = direction.x * desired.x + direction.y * desired.y;
      if (alignment > FlightControlConfig.stop.alignmentThreshold) {
        setSlotPower(powerBySlot, thruster.slot, alignment * linearPower);
      }
    }
  }

  if (hasTargetHeading) {
    addTurnStabilization(powerBySlot, input.targetAngle, rotation, angularVelocity);
  } else {
    addAngularDamping(powerBySlot, angularVelocity);
  }

  return createThrusterCommand(powerBySlot, true);
}

function createAutomaticThrusterCommand(world, ship, input) {
  const powerBySlot = new Map();
  const requestedSpeed = clampSpeed(input?.speedLevel ?? 0);
  const rotation = getComponent(world, ship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
  const angularVelocity = getComponent(world, ship, Component.AngularVelocity)?.value ?? 0;
  const targetAngle = Number.isFinite(input?.targetAngle) ? input.targetAngle : SHIP_FACING_UP;
  const angleError = normalizeAngle(targetAngle - rotation);
  const alignment = Math.max(0, Math.cos(angleError));
  const mainPower = requestedSpeed * alignment;

  applyTurnSignal(powerBySlot, getTurnSignal(angleError, angularVelocity));

  if (mainPower > FlightControlConfig.minMainThrusterPower) {
    powerBySlot.set(ThrusterSlot.MainBack, mainPower);
  }

  return createThrusterCommand(powerBySlot, true);
}

function addTurnStabilization(powerBySlot, targetAngle, rotation, angularVelocity) {
  const angleError = normalizeAngle(targetAngle - rotation);
  applyTurnSignal(powerBySlot, getTurnSignal(angleError, angularVelocity));
}

function addAngularDamping(powerBySlot, angularVelocity) {
  applyTurnSignal(powerBySlot, -angularVelocity * FlightControlConfig.turn.dampingGain);
}

function getTurnSignal(angleError, angularVelocity) {
  return angleError * FlightControlConfig.turn.angleErrorGain
    - angularVelocity * FlightControlConfig.turn.angularVelocityGain;
}

function applyTurnSignal(powerBySlot, turnSignal) {
  const turnPower = clamp01(Math.abs(turnSignal));
  if (turnPower <= FlightControlConfig.turn.minPower) {
    return;
  }

  const slots = turnSignal > 0
    ? [ThrusterSlot.TopRight, ThrusterSlot.BottomLeft]
    : [ThrusterSlot.TopLeft, ThrusterSlot.BottomRight];
  for (const slot of slots) {
    setSlotPower(powerBySlot, slot, turnPower);
  }
}

function applyBatteryLimitToCommand(battery, thrusters, command, deltaSeconds) {
  const requestedEnergyPerSecond = thrusters.reduce(
    (total, thruster) => total + thruster.energyConsumption * (command.powerBySlot.get(thruster.slot) ?? 0),
    0
  ) * command.powerConsumptionWeight;

  if (requestedEnergyPerSecond <= 0) {
    setBatteryOutput(battery, 0);
    return command;
  }

  const availableScale = getBatteryPowerScale(battery, requestedEnergyPerSecond, deltaSeconds);
  drainBattery(battery, requestedEnergyPerSecond * availableScale, deltaSeconds);

  if (availableScale >= 1) {
    return command;
  }

  const scaledPowerBySlot = new Map();
  for (const [slot, power] of command.powerBySlot) {
    scaledPowerBySlot.set(slot, power * availableScale);
  }

  return createThrusterCommand(scaledPowerBySlot, command.stabilizing, command.powerConsumptionWeight);
}

function rechargeBattery(battery, deltaSeconds) {
  if (!battery) {
    return;
  }

  battery.charge = Math.min(battery.capacity, battery.charge + battery.rechargeRate * deltaSeconds);
}

function getBatteryPowerScale(battery, energyPerSecond, deltaSeconds) {
  if (!battery || energyPerSecond <= 0 || deltaSeconds <= 0) {
    return 1;
  }

  return Math.min(1, battery.charge / (energyPerSecond * deltaSeconds));
}

function drainBattery(battery, energyPerSecond, deltaSeconds) {
  if (!battery) {
    return;
  }

  const energyUsed = energyPerSecond * deltaSeconds;
  battery.charge = Math.max(0, battery.charge - energyUsed);
  setBatteryOutput(battery, energyPerSecond);
}

function setBatteryOutput(battery, energyPerSecond) {
  if (battery) {
    battery.outputRate = energyPerSecond;
  }
}

function createThrusterCommand(powerBySlot, stabilizing, powerConsumptionWeight = 1) {
  return { powerBySlot, stabilizing, powerConsumptionWeight: sanitizePowerConsumptionWeight(powerConsumptionWeight) };
}

function setPowerConsumptionWeight(command, powerConsumptionWeight) {
  return createThrusterCommand(command.powerBySlot, command.stabilizing, powerConsumptionWeight);
}

function sanitizePowerConsumptionWeight(value) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function setSlotPower(powerBySlot, slot, power) {
  powerBySlot.set(slot, Math.max(powerBySlot.get(slot) ?? 0, clamp01(power)));
}

export function applyThrusterCommandToShip(world, ship, command, rotation) {
  const acceleration = getComponent(world, ship, Component.Acceleration);
  const angularAcceleration = getComponent(world, ship, Component.AngularAcceleration);
  const mass = getComponent(world, ship, Component.Mass);
  const momentOfInertia = getComponent(world, ship, Component.MomentOfInertia);
  if (angularAcceleration) {
    angularAcceleration.value = 0;
  }

  for (const thruster of getShipThrusters(world, ship)) {
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
      const offset = rotate(thruster.localX, thruster.localY, rotation);
      const worldForce = { x: force.x * mass.value, y: force.y * mass.value };
      angularAcceleration.value += cross(offset, worldForce) / momentOfInertia.value;
    }
  }
}

export function resetThrusterPower(world) {
  for (const thruster of getComponents(world, Component.Thruster).values()) {
    thruster.power = 0;
    thruster.stabilizing = false;
  }
}

function localToWorld(thruster, rotation) {
  return rotate(thruster.directionX, thruster.directionY, rotation);
}

function clampSpeed(value) {
  return clamp(value, 0, MaxSpeedLevel);
}
