import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { getShipPartEntities } from "../game/shipParts.js";

export function applyShields(world, deltaSeconds) {
  if (deltaSeconds <= 0) {
    return;
  }

  for (const entity of queryEntities(world, [Component.Shield, Component.Health, Component.Parent])) {
    if (getComponent(world, entity, Component.Health).current <= 0) {
      continue;
    }

    const shield = getComponent(world, entity, Component.Shield);
    if (shield.strength >= shield.maxStrength) {
      continue;
    }

    const ship = getComponent(world, entity, Component.Parent).entity;
    const battery = getComponent(world, ship, Component.Battery);
    if (!battery) {
      continue;
    }

    const desired = Math.min(shield.rechargeRatePerSecond * deltaSeconds, shield.maxStrength - shield.strength);
    const affordable = Math.min(desired, battery.charge / shield.energyPerStrength);
    if (affordable <= 0) {
      continue;
    }

    shield.strength += affordable;
    battery.charge -= affordable * shield.energyPerStrength;
  }
}

export function absorbProjectileDamage(world, target, damage) {
  let remaining = damage;

  for (const entity of getShipPartEntities(world, target, [Component.Shield, Component.Health])) {
    if (remaining <= 0) {
      break;
    }

    if (getComponent(world, entity, Component.Health).current <= 0) {
      continue;
    }

    const shield = getComponent(world, entity, Component.Shield);
    const absorbed = Math.min(shield.strength, remaining);
    if (absorbed <= 0) {
      continue;
    }

    shield.strength -= absorbed;
    shield.lastHitAt = world.time;
    remaining -= absorbed;

    const stress = getComponent(world, entity, Component.ComponentStress);
    if (stress) {
      stress.heat += absorbed * shield.heatPerAbsorbedDamage;
    }
  }

  return remaining;
}
