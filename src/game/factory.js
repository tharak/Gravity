import { DefaultShipModelConfig, DefaultShipViewConfig, StarterShipModelConfig, StarterShipViewConfig, ThrusterModelConfig, ThrusterViewConfig } from "../config/shipConfig.js";
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
    mass: ship.mass ?? DefaultShipModelConfig.mass,
    radius: ship.radius ?? DefaultShipViewConfig.radius,
    rotation: ship.rotation ?? SHIP_FACING_UP,
    angular: true,
    angularVelocity: ship.angularVelocity ?? 0,
    momentOfInertia: ship.momentOfInertia ?? getShipMomentOfInertia(
      ship.mass ?? DefaultShipModelConfig.mass,
      ship.shipFrame ?? ship.frame ?? DefaultShipViewConfig.frame
    ),
    playerControlled: ship.playerControlled,
    shipFrame: ship.shipFrame ?? ship.frame ?? DefaultShipViewConfig.frame
  });

  const maxHealth = ship.maxHealth ?? DefaultShipModelConfig.maxHealth;
  addComponent(world, entity, Component.Health, {
    max: maxHealth,
    current: Math.min(maxHealth, ship.health ?? maxHealth)
  });

  addComponent(world, entity, Component.Battery, {
    capacity: ship.batteryCapacity ?? DefaultShipModelConfig.batteryCapacity,
    charge: ship.batteryCharge ?? ship.batteryCapacity ?? DefaultShipModelConfig.batteryCapacity,
    rechargeRate: ship.batteryRechargeRate ?? DefaultShipModelConfig.batteryRechargeRate
  });

  for (const thruster of createDefaultThrusters(
    entity,
    ship.maxThrusterSpeed ?? DefaultShipModelConfig.maxThrusterSpeed,
    ship.thrusterModels ?? ThrusterModelConfig
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
    energyConsumption: thruster.energyConsumption,
    number: thruster.number,
    power: 0,
    stabilizing: false,
    viewSizeMultiplier: thruster.viewSizeMultiplier,
    color: thruster.color
  });
  return entity;
}

function getShipMomentOfInertia(mass, frame) {
  return mass * (frame.width * frame.width + frame.height * frame.height) / 12;
}

function createDefaultThrusters(shipEntity, maxSpeed, thrusterModels) {
  return thrusterModels.map((model) => {
    const view = ThrusterViewConfig.placements.find((candidate) => candidate.slot === model.slot);
    if (!view) {
      throw new Error("Missing thruster view config for " + model.slot);
    }

    return {
      shipEntity,
      number: model.number,
      slot: model.slot,
      localX: view.localX,
      localY: view.localY,
      directionX: view.directionX,
      directionY: view.directionY,
      maxAcceleration: model.maxAcceleration,
      size: model.size,
      viewSizeMultiplier: ThrusterViewConfig.sizeMultiplier,
      maxSpeed,
      energyConsumption: model.energyConsumption,
      color: thrusterColors[model.slot]
    };
  });
}

export function seedStarterSystem(world) {
  createShip(world, {
    x: 0,
    y: 0,
    mass: StarterShipModelConfig.mass,
    radius: StarterShipViewConfig.radius,
    playerControlled: StarterShipModelConfig.playerControlled,
    shipFrame: StarterShipViewConfig.frame
  });
}
