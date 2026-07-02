import { DefaultShipConfig, StarterShipConfig, ThrusterLayoutConfig } from "../config/shipConfig.js";
import { BodyKind, Component } from "../ecs/components.js";
import { addComponent, createEntity } from "../ecs/world.js";
import { WORLD_NORTH_ANGLE } from "./navigation.js";
import { thrusterColors } from "./thrusterPalette.js";

export const SHIP_FACING_UP = WORLD_NORTH_ANGLE;

export function createBody(world, body) {
  const entity = createEntity(world);
  addComponent(world, entity, Component.BodyKind, { value: body.kind });
  addComponent(world, entity, Component.Position, { x: body.x, y: body.y });
  addComponent(world, entity, Component.Mass, { value: body.mass });
  addComponent(world, entity, Component.Radius, { value: body.radius });

  if (body.rotation !== undefined) {
    addComponent(world, entity, Component.Rotation, { angle: body.rotation });
  }

  if (body.shipFrame) {
    addComponent(world, entity, Component.ShipFrame, { ...body.shipFrame });
  }

  if (body.static) {
    addComponent(world, entity, Component.StaticBody, { value: true });
  } else {
    addComponent(world, entity, Component.Velocity, { x: body.vx ?? 0, y: body.vy ?? 0 });
    addComponent(world, entity, Component.Acceleration, { x: 0, y: 0 });
    addComponent(world, entity, Component.OrbitTrail, { points: [] });

    if (body.angular) {
      addComponent(world, entity, Component.AngularVelocity, { value: body.angularVelocity ?? 0 });
      addComponent(world, entity, Component.AngularAcceleration, { value: 0 });
      addComponent(world, entity, Component.MomentOfInertia, { value: body.momentOfInertia });
    }
  }

  if (body.playerControlled) {
    addComponent(world, entity, Component.PlayerControlled, { inputId: body.playerControlled });
  }

  if (body.resources) {
    addComponent(world, entity, Component.Resource, { ...body.resources });
  }

  return entity;
}

export function createShip(world, ship) {
  const entity = createBody(world, {
    kind: BodyKind.Ship,
    x: ship.x,
    y: ship.y,
    vx: ship.vx ?? 0,
    vy: ship.vy ?? 0,
    mass: ship.mass ?? DefaultShipConfig.mass,
    radius: ship.radius ?? DefaultShipConfig.radius,
    rotation: ship.rotation ?? SHIP_FACING_UP,
    angular: true,
    angularVelocity: ship.angularVelocity ?? 0,
    momentOfInertia: ship.momentOfInertia ?? getShipMomentOfInertia(
      ship.mass ?? DefaultShipConfig.mass,
      ship.shipFrame ?? DefaultShipConfig.frame
    ),
    playerControlled: ship.playerControlled,
    shipFrame: ship.shipFrame ?? DefaultShipConfig.frame
  });

  const maxHealth = ship.maxHealth ?? DefaultShipConfig.maxHealth;
  addComponent(world, entity, Component.Health, {
    max: maxHealth,
    current: Math.min(maxHealth, ship.health ?? maxHealth)
  });

  addComponent(world, entity, Component.Battery, {
    capacity: ship.batteryCapacity ?? DefaultShipConfig.batteryCapacity,
    charge: ship.batteryCharge ?? ship.batteryCapacity ?? DefaultShipConfig.batteryCapacity,
    rechargeRate: ship.batteryRechargeRate ?? DefaultShipConfig.batteryRechargeRate
  });

  for (const thruster of createDefaultThrusters(
    entity,
    ship.thrusterAcceleration ?? DefaultShipConfig.thrusterAcceleration,
    ship.maxThrusterSpeed ?? DefaultShipConfig.maxThrusterSpeed
  )) {
    createThruster(world, thruster);
  }

  return entity;
}

export function createThruster(world, thruster) {
  const entity = createEntity(world);
  addComponent(world, entity, Component.Parent, { entity: thruster.shipEntity });
  addComponent(world, entity, Component.Thruster, {
    shipEntity: thruster.shipEntity,
    slot: thruster.slot,
    localX: thruster.localX,
    localY: thruster.localY,
    directionX: thruster.directionX,
    directionY: thruster.directionY,
    maxAcceleration: thruster.maxAcceleration,
    size: thruster.size,
    maxSpeed: thruster.maxSpeed,
    energyUsePerSecond: thruster.energyUsePerSecond,
    number: thruster.number,
    power: 0,
    stabilizing: false,
    color: thruster.color
  });
  return entity;
}

function getShipMomentOfInertia(mass, frame) {
  return mass * (frame.width * frame.width + frame.height * frame.height) / 12;
}

function createDefaultThrusters(shipEntity, maxAcceleration, maxSpeed) {
  return ThrusterLayoutConfig.map((thruster) => ({
    shipEntity,
    number: thruster.number,
    slot: thruster.slot,
    localX: thruster.localX,
    localY: thruster.localY,
    directionX: thruster.directionX,
    directionY: thruster.directionY,
    maxAcceleration: maxAcceleration * thruster.size,
    size: thruster.size,
    maxSpeed,
    energyUsePerSecond: thruster.energyUsePerSecond,
    color: thrusterColors[thruster.slot]
  }));
}

export function seedStarterSystem(world) {
  createShip(world, {
    x: 0,
    y: 0,
    mass: StarterShipConfig.mass,
    radius: StarterShipConfig.radius,
    playerControlled: StarterShipConfig.playerControlled,
    thrusterAcceleration: StarterShipConfig.thrusterAcceleration,
    shipFrame: StarterShipConfig.frame
  });
}
