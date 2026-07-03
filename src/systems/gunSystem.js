import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { rotate } from "../core/vector.js";
import { createProjectile, SHIP_FACING_UP } from "../game/factory.js";
import { getShipPartEntities } from "../game/shipParts.js";
import { findNearestOpposingShip } from "../game/targeting.js";
import { GunAimMode, GunShootMode } from "../input/playerInput.js";

const automaticGunInput = Object.freeze({
  aimMode: GunAimMode.Automatic,
  shootMode: GunShootMode.Automatic
});

export function applyGuns(world, inputById, deltaSeconds = 0) {
  for (const ship of queryEntities(world, [Component.PlayerControlled, Component.Position])) {
    const player = getComponent(world, ship, Component.PlayerControlled);
    const input = inputById[player.inputId];
    updateShipGuns(world, ship, input?.gun, deltaSeconds);
  }

  for (const ship of queryEntities(world, [Component.Faction, Component.Position])) {
    if (getComponent(world, ship, Component.PlayerControlled) !== undefined) {
      continue;
    }

    updateShipGuns(world, ship, automaticGunInput, deltaSeconds);
  }
}

function updateShipGuns(world, ship, gunInput, deltaSeconds) {
  for (const gunEntity of getShipPartEntities(world, ship, [Component.Gun, Component.Health])) {
    updateGun(world, ship, gunEntity, gunInput, deltaSeconds);
  }
}

function updateGun(world, ship, gunEntity, gunInput, deltaSeconds) {
  const gun = getComponent(world, gunEntity, Component.Gun);
  gun.cooldown = Math.max(0, gun.cooldown - deltaSeconds);
  gun.firing = false;

  if (getComponent(world, gunEntity, Component.Health).current <= 0) {
    return;
  }

  const muzzle = getGunWorldPosition(world, ship, gun);
  const target = findNearestOpposingShip(world, ship, muzzle);

  aimGun(world, ship, gun, gunInput, muzzle, target);

  const stress = getComponent(world, gunEntity, Component.ComponentStress);
  const tolerance = getComponent(world, gunEntity, Component.DamageTolerance);
  updateOverheatHold(gun, stress, tolerance);

  if (gun.overheated || !wantsToShoot(gun, gunInput, target) || gun.cooldown > 0) {
    return;
  }

  const battery = getComponent(world, ship, Component.Battery);
  if (battery !== undefined && battery.charge < gun.energyPerShot) {
    return;
  }

  if (battery !== undefined) {
    battery.charge -= gun.energyPerShot;
  }

  fireProjectile(world, ship, gun, muzzle);
  gun.cooldown = gun.fireCooldownSeconds;
  gun.firing = true;

  if (stress) {
    stress.heat += gun.heatPerShot;
  }
}

function updateOverheatHold(gun, stress, tolerance) {
  if (!stress || !tolerance) {
    return;
  }

  if (stress.heat + gun.heatPerShot > tolerance.heat) {
    gun.overheated = true;
  } else if (stress.heat <= tolerance.heat * gun.heatResumeRatio) {
    gun.overheated = false;
  }
}

function aimGun(world, ship, gun, gunInput, muzzle, target) {
  if (gunInput?.aimMode === GunAimMode.Automatic) {
    if (target !== undefined) {
      gun.aimAngle = getInterceptAngle(world, ship, gun, muzzle, target);
    }
    return;
  }

  if (Number.isFinite(gunInput?.aimX) && Number.isFinite(gunInput?.aimY)) {
    gun.aimAngle = Math.atan2(gunInput.aimY - muzzle.y, gunInput.aimX - muzzle.x);
  }
}

function getInterceptAngle(world, ship, gun, muzzle, target) {
  const shipVelocity = getComponent(world, ship, Component.Velocity) ?? { x: 0, y: 0 };
  const targetVelocity = getComponent(world, target.entity, Component.Velocity) ?? { x: 0, y: 0 };
  const relX = target.x - muzzle.x;
  const relY = target.y - muzzle.y;
  const relVx = targetVelocity.x - shipVelocity.x;
  const relVy = targetVelocity.y - shipVelocity.y;
  const time = getInterceptTime(relX, relY, relVx, relVy, gun.projectileSpeed);

  return Math.atan2(relY + relVy * time, relX + relVx * time);
}

function getInterceptTime(relX, relY, relVx, relVy, projectileSpeed) {
  const a = relVx * relVx + relVy * relVy - projectileSpeed * projectileSpeed;
  const b = 2 * (relX * relVx + relY * relVy);
  const c = relX * relX + relY * relY;

  if (Math.abs(a) < 1e-9) {
    return b < 0 ? -c / b : 0;
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return 0;
  }

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const first = (-b - sqrtDiscriminant) / (2 * a);
  const second = (-b + sqrtDiscriminant) / (2 * a);
  const time = Math.min(...[first, second].filter((candidate) => candidate > 0));

  return Number.isFinite(time) ? time : 0;
}

function wantsToShoot(gun, gunInput, target) {
  if (gunInput?.shootMode === GunShootMode.Automatic) {
    return target !== undefined && target.distance <= gun.range;
  }

  return gunInput?.shooting === true;
}

function fireProjectile(world, ship, gun, muzzle) {
  const direction = { x: Math.cos(gun.aimAngle), y: Math.sin(gun.aimAngle) };
  const shipVelocity = getComponent(world, ship, Component.Velocity) ?? { x: 0, y: 0 };

  createProjectile(world, {
    firedBy: ship,
    faction: getComponent(world, ship, Component.Faction)?.id,
    x: muzzle.x + direction.x * gun.barrelLength,
    y: muzzle.y + direction.y * gun.barrelLength,
    vx: shipVelocity.x + direction.x * gun.projectileSpeed,
    vy: shipVelocity.y + direction.y * gun.projectileSpeed,
    mass: gun.projectileMass,
    radius: gun.projectileRadius,
    damage: gun.projectileDamage,
    lifetimeSeconds: gun.projectileLifetimeSeconds
  });
}

function getGunWorldPosition(world, ship, gun) {
  const position = getComponent(world, ship, Component.Position);
  const rotation = getComponent(world, ship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
  const offset = rotate(gun.localX, gun.localY, rotation);
  return { x: position.x + offset.x, y: position.y + offset.y };
}

