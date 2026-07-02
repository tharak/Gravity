import { BodyKind, Component } from "../ecs/components.js";
import { getComponent, getComponents, queryEntities } from "../ecs/world.js";
import { rotate } from "../core/vector.js";
import { createProjectile, SHIP_FACING_UP } from "../game/factory.js";
import { getShipPartEntities } from "../game/shipParts.js";
import { GunAimMode, GunShootMode } from "../input/playerInput.js";

export function applyGuns(world, inputById, deltaSeconds = 0) {
  for (const ship of queryEntities(world, [Component.PlayerControlled, Component.Position])) {
    const player = getComponent(world, ship, Component.PlayerControlled);
    const input = inputById[player.inputId];
    for (const gunEntity of getShipPartEntities(world, ship, [Component.Gun, Component.Health])) {
      updateGun(world, ship, gunEntity, input?.gun, deltaSeconds);
    }
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
  const target = findNearestShip(world, ship, muzzle);

  aimGun(gun, gunInput, muzzle, target);

  if (!wantsToShoot(gun, gunInput, target) || gun.cooldown > 0) {
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

  const stress = getComponent(world, gunEntity, Component.ComponentStress);
  if (stress) {
    stress.heat += gun.heatPerShot;
  }
}

function aimGun(gun, gunInput, muzzle, target) {
  if (gunInput?.aimMode === GunAimMode.Automatic) {
    if (target !== undefined) {
      gun.aimAngle = Math.atan2(target.y - muzzle.y, target.x - muzzle.x);
    }
    return;
  }

  if (Number.isFinite(gunInput?.aimX) && Number.isFinite(gunInput?.aimY)) {
    gun.aimAngle = Math.atan2(gunInput.aimY - muzzle.y, gunInput.aimX - muzzle.x);
  }
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

function findNearestShip(world, ship, origin) {
  let nearest;
  for (const [entity, bodyKind] of getComponents(world, Component.BodyKind)) {
    if (entity === ship || bodyKind.value !== BodyKind.Ship) {
      continue;
    }

    const position = getComponent(world, entity, Component.Position);
    if (!position) {
      continue;
    }

    const distance = Math.hypot(position.x - origin.x, position.y - origin.y);
    if (nearest === undefined || distance < nearest.distance) {
      nearest = { entity, x: position.x, y: position.y, distance };
    }
  }

  return nearest;
}
