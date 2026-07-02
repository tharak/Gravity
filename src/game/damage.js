import { CollisionConfig } from "../config/collisionConfig.js";
import { MaterialStressConfig } from "../config/materialStressConfig.js";
import { Component } from "../ecs/components.js";
import { addComponent, createEntity, getComponent, getComponents, removeEntity } from "../ecs/world.js";
import { getShipPartEntities } from "./shipParts.js";

export function applyDamage(world, entity, damage) {
  const health = getComponent(world, entity, Component.Health);
  if (!health || damage <= 0) {
    return;
  }

  const appliedDamage = Math.min(health.current, damage);
  health.current = Math.max(0, health.current - damage);
  if (appliedDamage > 0) {
    addComponentPressure(world, entity, appliedDamage * MaterialStressConfig.collisionPressurePerDamage);
    createDamagePopup(world, entity, appliedDamage);
  }
}

export function removeExpiredDamagePopups(world) {
  for (const [entity, popup] of getComponents(world, Component.DamagePopup)) {
    if (world.time - popup.createdAt > popup.duration) {
      removeEntity(world, entity);
    }
  }
}

function addComponentPressure(world, parent, pressure) {
  for (const entity of getShipPartEntities(world, parent, [Component.ComponentStress])) {
    getComponent(world, entity, Component.ComponentStress).pressure += pressure;
  }
}

function createDamagePopup(world, entity, damage) {
  const position = getComponent(world, entity, Component.Position);
  const radius = getComponent(world, entity, Component.Radius)?.value ?? 0;
  if (!position) {
    return;
  }

  const popup = createEntity(world);
  addComponent(world, popup, Component.DamagePopup, {
    x: position.x,
    y: position.y - radius - CollisionConfig.damagePopupRadiusOffset,
    damage,
    createdAt: world.time,
    duration: CollisionConfig.damagePopupDuration
  });
}
