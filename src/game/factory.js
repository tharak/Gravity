import { FuelConfig } from "../config/fuelConfig.js";
import { MaterialStressConfig } from "../config/materialStressConfig.js";
import { DefaultShipModelConfig, DefaultShipViewConfig, StarterShipModelConfig, StarterShipViewConfig, ThrusterModelConfig, ThrusterViewConfig } from "../config/shipConfig.js";
import { SolarPanelModelConfig, SolarPanelViewConfig } from "../config/solarPanelConfig.js";
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

  addComponent(world, entity, Component.Fuel, {
    capacity: ship.fuelCapacity ?? FuelConfig.minimumCapacity,
    current: Math.min(ship.fuel ?? ship.fuelCapacity ?? FuelConfig.minimumCapacity, ship.fuelCapacity ?? FuelConfig.minimumCapacity)
  });

  for (const thruster of createDefaultThrusters(
    entity,
    ship.thrusterModels ?? ThrusterModelConfig
  )) {
    createThruster(world, thruster);
  }

  createSolarPanel(world, {
    shipEntity: entity,
    ...SolarPanelModelConfig,
    ...SolarPanelViewConfig
  });

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
    energyConsumption: thruster.energyConsumption,
    fuelConsumption: thruster.fuelConsumption,
    number: thruster.number,
    power: 0,
    stabilizing: false,
    viewSizeMultiplier: thruster.viewSizeMultiplier,
    color: thruster.color
  });
  addComponent(world, entity, Component.Health, {
    max: thruster.maxHealth ?? MaterialStressConfig.defaultHealth,
    current: thruster.health ?? thruster.maxHealth ?? MaterialStressConfig.defaultHealth
  });
  addComponent(world, entity, Component.ComponentStress, { heat: 0, pressure: 0, vibration: 0, acceleration: 0 });
  addComponent(world, entity, Component.DamageTolerance, { ...MaterialStressConfig.tolerances });
  return entity;
}

export function createSolarPanel(world, solarPanel) {
  const entity = createEntity(world);
  addComponent(world, entity, Component.Parent, { entity: solarPanel.shipEntity });
  addComponent(world, entity, Component.SolarPanel, {
    shipEntity: solarPanel.shipEntity,
    batteryRechargeRate: solarPanel.batteryRechargeRate,
    localX: solarPanel.localX,
    localY: solarPanel.localY,
    radius: solarPanel.radius
  });
  addComponent(world, entity, Component.Health, {
    max: solarPanel.maxHealth,
    current: solarPanel.health ?? solarPanel.maxHealth
  });
  addComponent(world, entity, Component.ComponentStress, { heat: 0, pressure: 0, vibration: 0, acceleration: 0 });
  addComponent(world, entity, Component.DamageTolerance, { ...MaterialStressConfig.tolerances });
  return entity;
}

function getShipMomentOfInertia(mass, frame) {
  return mass * (frame.width * frame.width + frame.height * frame.height) / 12;
}

function createDefaultThrusters(shipEntity, thrusterModels) {
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
      maxAcceleration: model.acceleration * model.size,
      size: model.size,
      viewSizeMultiplier: ThrusterViewConfig.sizeMultiplier,
      energyConsumption: model.energyConsumption,
      fuelConsumption: model.fuelConsumption,
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


export function setShipFuelFromMapSize(world) {
  const diagonal = getWorldDiagonal(world);
  const capacity = Math.max(FuelConfig.minimumCapacity, diagonal * FuelConfig.capacityMapDiagonalRatio);
  for (const ship of queryShipFuelEntities(world)) {
    const fuel = addOrGetFuel(world, ship, capacity);
    fuel.capacity = capacity;
    fuel.current = Math.min(fuel.current, capacity);
    if (fuel.current <= FuelConfig.minimumCapacity) {
      fuel.current = capacity;
    }
  }
}

function queryShipFuelEntities(world) {
  const ships = [];
  const bodyKinds = world.components.get(Component.BodyKind) ?? new Map();
  for (const [entity, bodyKind] of bodyKinds) {
    if (bodyKind.value === BodyKind.Ship) {
      ships.push(entity);
    }
  }
  return ships;
}

function addOrGetFuel(world, ship, capacity) {
  const existing = world.components.get(Component.Fuel)?.get(ship);
  if (existing) {
    return existing;
  }

  return addComponent(world, ship, Component.Fuel, { capacity, current: capacity });
}

function getWorldDiagonal(world) {
  const positions = world.components.get(Component.Position) ?? new Map();
  const radii = world.components.get(Component.Radius) ?? new Map();
  if (positions.size === 0) {
    return 0;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [entity, position] of positions) {
    const radius = radii.get(entity)?.value ?? 0;
    minX = Math.min(minX, position.x - radius);
    maxX = Math.max(maxX, position.x + radius);
    minY = Math.min(minY, position.y - radius);
    maxY = Math.max(maxY, position.y + radius);
  }

  return Math.hypot(maxX - minX, maxY - minY);
}
