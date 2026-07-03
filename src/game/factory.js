import { BatteryConfig } from "../config/batteryConfig.js";
import { GunModelConfig, GunViewConfig } from "../config/gunConfig.js";
import { MaterialStressConfig } from "../config/materialStressConfig.js";
import { ShieldModelConfig, ShieldViewConfig } from "../config/shieldConfig.js";
import { DefaultShipModelConfig, DefaultShipViewConfig, StarterShipModelConfig, StarterShipViewConfig, ThrusterModelConfig, ThrusterViewConfig } from "../config/shipConfig.js";
import { SolarPanelModelConfig, SolarPanelViewConfig } from "../config/solarPanelConfig.js";
import { BodyKind, Component } from "../ecs/components.js";
import { addComponent, createEntity, getComponent, getComponents } from "../ecs/world.js";
import { WORLD_NORTH_ANGLE } from "./navigation.js";
import { getWorldBounds } from "./worldBounds.js";
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

  if (body.faction) {
    addComponent(world, entity, Component.Faction, { id: body.faction });
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
    faction: ship.faction,
    shipFrame: ship.shipFrame ?? ship.frame ?? DefaultShipViewConfig.frame
  });

  if (ship.fleet) {
    addComponent(world, entity, Component.FleetMember, {
      flagship: ship.fleet.flagship,
      slotIndex: ship.fleet.slotIndex
    });
  }

  const maxHealth = ship.maxHealth ?? DefaultShipModelConfig.maxHealth;
  addComponent(world, entity, Component.Health, {
    max: maxHealth,
    current: Math.min(maxHealth, ship.health ?? maxHealth)
  });

  const batteryCapacity = ship.batteryCapacity ?? BatteryConfig.minimumCapacity;
  addComponent(world, entity, Component.Battery, {
    capacity: batteryCapacity,
    charge: Math.min(ship.batteryCharge ?? batteryCapacity, batteryCapacity),
    rechargeRate: ship.batteryRechargeRate ?? DefaultShipModelConfig.batteryRechargeRate
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

  createGun(world, {
    shipEntity: entity,
    ...GunModelConfig,
    ...GunViewConfig
  });

  createShield(world, {
    shipEntity: entity,
    ...ShieldModelConfig,
    ...ShieldViewConfig
  });

  return entity;
}

export function createThruster(world, thruster) {
  const entity = createEntity(world);
  addComponent(world, entity, Component.Parent, { entity: thruster.shipEntity });
  addComponent(world, entity, Component.Thruster, {
    slot: thruster.slot,
    localX: thruster.localX,
    localY: thruster.localY,
    directionX: thruster.directionX,
    directionY: thruster.directionY,
    maxAcceleration: thruster.maxAcceleration,
    size: thruster.size,
    energyConsumption: thruster.energyConsumption,
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

export function createGun(world, gun) {
  const entity = createEntity(world);
  addComponent(world, entity, Component.Parent, { entity: gun.shipEntity });
  addComponent(world, entity, Component.Gun, {
    localX: gun.localX,
    localY: gun.localY,
    radius: gun.radius,
    barrelLength: gun.barrelLength,
    range: gun.range,
    fireCooldownSeconds: gun.fireCooldownSeconds,
    energyPerShot: gun.energyPerShot,
    heatPerShot: gun.heatPerShot,
    heatResumeRatio: gun.heatResumeRatio,
    projectileSpeed: gun.projectileSpeed,
    projectileDamage: gun.projectileDamage,
    projectileMass: gun.projectileMass,
    projectileRadius: gun.projectileRadius,
    projectileLifetimeSeconds: gun.projectileLifetimeSeconds,
    aimAngle: SHIP_FACING_UP,
    cooldown: 0,
    firing: false,
    overheated: false
  });
  addComponent(world, entity, Component.Health, {
    max: gun.maxHealth ?? MaterialStressConfig.defaultHealth,
    current: gun.health ?? gun.maxHealth ?? MaterialStressConfig.defaultHealth
  });
  addComponent(world, entity, Component.ComponentStress, { heat: 0, pressure: 0, vibration: 0, acceleration: 0 });
  addComponent(world, entity, Component.DamageTolerance, { ...MaterialStressConfig.tolerances });
  return entity;
}

export function createShield(world, shield) {
  const entity = createEntity(world);
  addComponent(world, entity, Component.Parent, { entity: shield.shipEntity });
  addComponent(world, entity, Component.Shield, {
    localX: shield.localX,
    localY: shield.localY,
    radiusOffset: shield.radiusOffset,
    maxStrength: shield.maxStrength,
    strength: shield.strength ?? shield.maxStrength,
    rechargeRatePerSecond: shield.rechargeRatePerSecond,
    energyPerStrength: shield.energyPerStrength,
    heatPerAbsorbedDamage: shield.heatPerAbsorbedDamage,
    lastHitAt: -Infinity
  });
  addComponent(world, entity, Component.Health, {
    max: shield.maxHealth ?? MaterialStressConfig.defaultHealth,
    current: shield.health ?? shield.maxHealth ?? MaterialStressConfig.defaultHealth
  });
  addComponent(world, entity, Component.ComponentStress, { heat: 0, pressure: 0, vibration: 0, acceleration: 0 });
  addComponent(world, entity, Component.DamageTolerance, { ...MaterialStressConfig.tolerances });
  return entity;
}

export function createProjectile(world, projectile) {
  const entity = createEntity(world);
  addComponent(world, entity, Component.Projectile, {
    firedBy: projectile.firedBy,
    faction: projectile.faction,
    damage: projectile.damage,
    createdAt: world.time,
    lifetimeSeconds: projectile.lifetimeSeconds
  });
  addComponent(world, entity, Component.Position, { x: projectile.x, y: projectile.y });
  addComponent(world, entity, Component.Velocity, { x: projectile.vx, y: projectile.vy });
  addComponent(world, entity, Component.Acceleration, { x: 0, y: 0 });
  addComponent(world, entity, Component.Mass, { value: projectile.mass });
  addComponent(world, entity, Component.Radius, { value: projectile.radius });
  addComponent(world, entity, Component.Health, { max: 1, current: 1 });
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


export function setShipBatteryFromMapSize(world) {
  const diagonal = getWorldDiagonal(world);
  const capacity = Math.max(BatteryConfig.minimumCapacity, diagonal * BatteryConfig.capacityMapDiagonalRatio);
  for (const ship of queryShipBatteryEntities(world)) {
    const battery = addOrGetBattery(world, ship, capacity);
    battery.capacity = capacity;
    battery.charge = Math.min(battery.charge, capacity);
    if (battery.charge <= BatteryConfig.minimumCapacity) {
      battery.charge = capacity;
    }
  }
}

function queryShipBatteryEntities(world) {
  const ships = [];
  for (const [entity, bodyKind] of getComponents(world, Component.BodyKind)) {
    if (bodyKind.value === BodyKind.Ship) {
      ships.push(entity);
    }
  }
  return ships;
}

function addOrGetBattery(world, ship, capacity) {
  const existing = getComponent(world, ship, Component.Battery);
  if (existing) {
    return existing;
  }

  return addComponent(world, ship, Component.Battery, {
    capacity,
    charge: capacity,
    rechargeRate: DefaultShipModelConfig.batteryRechargeRate
  });
}

function getWorldDiagonal(world) {
  const bounds = getWorldBounds(world);
  if (!bounds) {
    return 0;
  }

  return Math.hypot(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
}
