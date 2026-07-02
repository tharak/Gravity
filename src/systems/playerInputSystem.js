import { Component, ThrusterSlot } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { SHIP_FACING_UP } from "../game/factory.js";
import { ControllerMode, SpeedOrder } from "../input/playerInput.js";

export function applyPlayerInput(world, inputById, deltaSeconds = 0) {
  resetThrusterPower(world);

  for (const ship of queryEntities(world, [Component.Acceleration, Component.PlayerControlled])) {
    const player = getComponent(world, ship, Component.PlayerControlled);
    const input = inputById[player.inputId];
    const rotation = getComponent(world, ship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
    const command = createPilotThrusterCommand(world, ship, input, deltaSeconds);

    applyThrusterCommandToShip(world, ship, command, rotation);
  }
}

function createPilotThrusterCommand(world, ship, input, deltaSeconds) {
  const battery = getComponent(world, ship, Component.Battery);
  const fuel = getComponent(world, ship, Component.Fuel);
  const thrusters = getShipThrusters(world, ship);

  rechargeBattery(battery, deltaSeconds);

  const command = input?.speedOrder === SpeedOrder.Stop
    ? createStopThrusterCommand(world, ship, input)
    : input?.controllerMode === ControllerMode.Automatic
      ? createAutomaticThrusterCommand(world, ship, input)
      : createManualThrusterCommand(input);
  const weightedCommand = setPowerConsumptionWeight(command, input?.powerConsumptionWeight ?? 1);

  return applyResourceLimitsToCommand(battery, fuel, thrusters, weightedCommand, deltaSeconds);
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

  if (speed > 1) {
    const desired = { x: -velocity.x / speed, y: -velocity.y / speed };
    const linearPower = clamp01(speed / 45);
    for (const thruster of getShipThrusters(world, ship)) {
      const direction = localToWorld(thruster, rotation);
      const alignment = direction.x * desired.x + direction.y * desired.y;
      if (alignment > 0.35) {
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
  const turnSignal = getTurnSignal(angleError, angularVelocity);
  const turnPower = clamp01(Math.abs(turnSignal));
  const alignment = Math.max(0, Math.cos(angleError));
  const mainPower = requestedSpeed * alignment;

  applyTurnSignal(powerBySlot, turnSignal);

  if (mainPower > 0.02) {
    powerBySlot.set(ThrusterSlot.MainBack, mainPower);
  }

  return createThrusterCommand(powerBySlot, true);
}

function addTurnStabilization(powerBySlot, targetAngle, rotation, angularVelocity) {
  const angleError = normalizeAngle(targetAngle - rotation);
  applyTurnSignal(powerBySlot, getTurnSignal(angleError, angularVelocity));
}

function addAngularDamping(powerBySlot, angularVelocity) {
  applyTurnSignal(powerBySlot, -angularVelocity * 0.8);
}

function getTurnSignal(angleError, angularVelocity) {
  return angleError * 1.45 - angularVelocity * 0.35;
}

function applyTurnSignal(powerBySlot, turnSignal) {
  const turnPower = clamp01(Math.abs(turnSignal));
  if (turnPower <= 0.04) {
    return;
  }

  const slots = turnSignal > 0
    ? [ThrusterSlot.TopRight, ThrusterSlot.BottomLeft]
    : [ThrusterSlot.TopLeft, ThrusterSlot.BottomRight];
  for (const slot of slots) {
    setSlotPower(powerBySlot, slot, turnPower);
  }
}

function applyResourceLimitsToCommand(battery, fuel, thrusters, command, deltaSeconds) {
  const requestedEnergyPerSecond = thrusters.reduce(
    (total, thruster) => total + thruster.energyConsumption * (command.powerBySlot.get(thruster.slot) ?? 0),
    0
  ) * command.powerConsumptionWeight;
  const requestedFuelPerSecond = thrusters.reduce(
    (total, thruster) => total + thruster.fuelConsumption * (command.powerBySlot.get(thruster.slot) ?? 0),
    0
  ) * command.powerConsumptionWeight;

  if (requestedEnergyPerSecond <= 0 && requestedFuelPerSecond <= 0) {
    setBatteryOutput(battery, 0);
    setFuelOutput(fuel, 0);
    return command;
  }

  const batteryScale = getBatteryPowerScale(battery, requestedEnergyPerSecond, deltaSeconds);
  const fuelScale = getFuelPowerScale(fuel, requestedFuelPerSecond, deltaSeconds);
  const availableScale = Math.min(batteryScale, fuelScale);
  drainBattery(battery, requestedEnergyPerSecond * availableScale, deltaSeconds);
  drainFuel(fuel, requestedFuelPerSecond * availableScale, deltaSeconds);

  if (availableScale >= 1) {
    return command;
  }

  const scaledPowerBySlot = new Map();
  for (const [slot, power] of command.powerBySlot) {
    scaledPowerBySlot.set(slot, power * availableScale);
  }

  return createThrusterCommand(scaledPowerBySlot, command.stabilizing, command.powerConsumptionWeight);
}

function getShipThrusters(world, ship) {
  return queryEntities(world, [Component.Thruster])
    .map((entity) => getComponent(world, entity, Component.Thruster))
    .filter((thruster) => thruster.shipEntity === ship);
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

function getFuelPowerScale(fuel, fuelPerSecond, deltaSeconds) {
  if (!fuel || fuelPerSecond <= 0 || deltaSeconds <= 0) {
    return 1;
  }

  return Math.min(1, fuel.current / (fuelPerSecond * deltaSeconds));
}

function drainFuel(fuel, fuelPerSecond, deltaSeconds) {
  if (!fuel) {
    return;
  }

  const fuelUsed = fuelPerSecond * deltaSeconds;
  fuel.current = Math.max(0, fuel.current - fuelUsed);
  setFuelOutput(fuel, fuelPerSecond);
}

function setFuelOutput(fuel, fuelPerSecond) {
  if (fuel) {
    fuel.outputRate = fuelPerSecond;
  }
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

export function getThrusterSlotByNumber(number) {
  switch (number) {
    case 1:
      return ThrusterSlot.MainBack;
    case 2:
      return ThrusterSlot.FrontLeft;
    case 3:
      return ThrusterSlot.FrontRight;
    case 4:
      return ThrusterSlot.TopLeft;
    case 5:
      return ThrusterSlot.TopRight;
    case 6:
      return ThrusterSlot.BottomLeft;
    case 7:
      return ThrusterSlot.BottomRight;
    default:
      return undefined;
  }
}

function clampSpeed(value) {
  return Math.max(0, Math.min(1.25, Number.isFinite(value) ? value : 0));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
