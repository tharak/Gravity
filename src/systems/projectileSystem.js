import { Component } from "../ecs/components.js";
import { getComponent, queryEntities, removeEntity } from "../ecs/world.js";
import { applyDamage } from "../game/damage.js";
import { absorbProjectileDamage } from "./shieldSystem.js";

export function updateProjectiles(world) {
  for (const entity of queryEntities(world, [Component.Projectile, Component.Position, Component.Radius])) {
    const projectile = getComponent(world, entity, Component.Projectile);
    if (world.time - projectile.createdAt > projectile.lifetimeSeconds) {
      removeEntity(world, entity);
      continue;
    }

    const hit = findHitBody(world, entity, projectile);
    if (hit === undefined) {
      continue;
    }

    const remainingDamage = absorbProjectileDamage(world, hit, projectile.damage);
    if (remainingDamage > 0) {
      applyDamage(world, hit, remainingDamage);
    }
    removeEntity(world, entity);
  }
}

function findHitBody(world, projectileEntity, projectile) {
  const position = getComponent(world, projectileEntity, Component.Position);
  const radius = getComponent(world, projectileEntity, Component.Radius).value;

  for (const body of queryEntities(world, [Component.BodyKind, Component.Position, Component.Radius])) {
    if (body === projectile.firedBy) {
      continue;
    }

    if (projectile.faction !== undefined && getComponent(world, body, Component.Faction)?.id === projectile.faction) {
      continue;
    }

    const bodyPosition = getComponent(world, body, Component.Position);
    const bodyRadius = getComponent(world, body, Component.Radius).value;
    if (Math.hypot(bodyPosition.x - position.x, bodyPosition.y - position.y) < radius + bodyRadius) {
      return body;
    }
  }

  return undefined;
}
