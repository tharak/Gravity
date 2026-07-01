import { Component, ThrusterSlot } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { SHIP_FACING_UP } from "../game/factory.js";

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
  const powerBySlot = new Map();
  const requestedPower = clamp01(input?.powerLevel ?? 0);
  const activeSlots = input?.activeSlots ?? new Set();
  const thrusters = getShipThrusters(world, ship);

  rechargeBattery(battery, deltaSeconds);

  if (activeSlots.size === 0 || requestedPower <= 0) {
    setBatteryOutput(battery, 0);
    return createThrusterCommand(powerBySlot, false);
  }

  const selectedThrusters = thrusters.filter((thruster) => activeSlots.has(thruster.slot));
  const requestedEnergyPerSecond = selectedThrusters.reduce(
    (total, thruster) => total + thruster.energyUsePerSecond * requestedPower,
    0
  );
  const availableScale = getBatteryPowerScale(battery, requestedEnergyPerSecond, deltaSeconds);
  const actualPower = requestedPower * availableScale;

  drainBattery(battery, requestedEnergyPerSecond * availableScale, deltaSeconds);

  if (actualPower <= 0) {
    return createThrusterCommand(powerBySlot, false);
  }

  for (const thruster of selectedThrusters) {
    powerBySlot.set(thruster.slot, actualPower);
  }

  return createThrusterCommand(powerBySlot, false);
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

function setBatteryOutput(battery, energyPerSecond) {
  if (battery) {
    battery.outputRate = energyPerSecond;
  }
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

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
