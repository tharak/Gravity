import { BodyKind, Component, ThrusterSlot } from "../ecs/components.js";
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
    mass: ship.mass ?? 2,
    radius: ship.radius ?? 48,
    rotation: ship.rotation ?? SHIP_FACING_UP,
    angular: true,
    angularVelocity: ship.angularVelocity ?? 0,
    momentOfInertia: ship.momentOfInertia ?? getShipMomentOfInertia(
      ship.mass ?? 2,
      ship.shipFrame ?? { width: 88, height: 42 }
    ),
    playerControlled: ship.playerControlled,
    shipFrame: ship.shipFrame ?? { width: 88, height: 42 }
  });

  addComponent(world, entity, Component.Battery, {
    capacity: ship.batteryCapacity ?? 100,
    charge: ship.batteryCharge ?? ship.batteryCapacity ?? 100,
    rechargeRate: ship.batteryRechargeRate ?? 1
  });

  for (const thruster of createDefaultThrusters(
    entity,
    ship.thrusterAcceleration ?? 13,
    ship.maxThrusterSpeed ?? 120
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
  return [
    { shipEntity, number: 1, slot: ThrusterSlot.MainBack, localX: -50, localY: 0, directionX: 1, directionY: 0, maxAcceleration: maxAcceleration * 10, maxSpeed, energyUsePerSecond: 3, color: thrusterColors[ThrusterSlot.MainBack] },
    { shipEntity, number: 2, slot: ThrusterSlot.FrontLeft, localX: 42, localY: -12, directionX: -1, directionY: 0, maxAcceleration, maxSpeed, energyUsePerSecond: 1, color: thrusterColors[ThrusterSlot.FrontLeft] },
    { shipEntity, number: 3, slot: ThrusterSlot.FrontRight, localX: 42, localY: 12, directionX: -1, directionY: 0, maxAcceleration, maxSpeed, energyUsePerSecond: 1, color: thrusterColors[ThrusterSlot.FrontRight] },
    { shipEntity, number: 4, slot: ThrusterSlot.TopLeft, localX: -24, localY: -26, directionX: 0, directionY: 1, maxAcceleration, maxSpeed, energyUsePerSecond: 1, color: thrusterColors[ThrusterSlot.TopLeft] },
    { shipEntity, number: 5, slot: ThrusterSlot.TopRight, localX: 24, localY: -26, directionX: 0, directionY: 1, maxAcceleration, maxSpeed, energyUsePerSecond: 1, color: thrusterColors[ThrusterSlot.TopRight] },
    { shipEntity, number: 6, slot: ThrusterSlot.BottomLeft, localX: -24, localY: 26, directionX: 0, directionY: -1, maxAcceleration, maxSpeed, energyUsePerSecond: 1, color: thrusterColors[ThrusterSlot.BottomLeft] },
    { shipEntity, number: 7, slot: ThrusterSlot.BottomRight, localX: 24, localY: 26, directionX: 0, directionY: -1, maxAcceleration, maxSpeed, energyUsePerSecond: 1, color: thrusterColors[ThrusterSlot.BottomRight] }
  ];
}

export function seedStarterSystem(world) {
  createShip(world, {
    x: 0,
    y: 0,
    mass: 2,
    radius: 56,
    playerControlled: "player-one",
    thrusterAcceleration: 15,
    shipFrame: { width: 94, height: 46 }
  });
}
