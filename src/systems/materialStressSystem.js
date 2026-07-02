import { MaterialStressConfig } from "../config/materialStressConfig.js";
import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";

export function applyMaterialStress(world, deltaSeconds) {
  for (const entity of queryEntities(world, [Component.Parent, Component.Health, Component.ComponentStress, Component.DamageTolerance])) {
    const parent = getComponent(world, entity, Component.Parent).entity;
    const stress = getComponent(world, entity, Component.ComponentStress);
    const tolerance = getComponent(world, entity, Component.DamageTolerance);
    const health = getComponent(world, entity, Component.Health);
    const thruster = getComponent(world, entity, Component.Thruster);
    const angularVelocity = getComponent(world, parent, Component.AngularVelocity)?.value ?? 0;
    const acceleration = getComponent(world, parent, Component.Acceleration) ?? { x: 0, y: 0 };

    stress.heat = Math.max(0, stress.heat - MaterialStressConfig.heatDissipationPerSecond * deltaSeconds);
    stress.pressure = Math.max(0, stress.pressure - MaterialStressConfig.pressureDissipationPerSecond * deltaSeconds);
    stress.vibration = Math.abs(angularVelocity) * MaterialStressConfig.vibrationFromAngularVelocity;
    stress.acceleration = Math.hypot(acceleration.x, acceleration.y) * MaterialStressConfig.accelerationLoadMultiplier;

    if (thruster) {
      stress.heat += thruster.power * MaterialStressConfig.heatGainPerPowerSecond * deltaSeconds;
    }

    const damage = getStressDamage(stress, tolerance) * deltaSeconds;
    if (damage > 0) {
      health.current = Math.max(0, health.current - damage);
    }
  }
}

function getStressDamage(stress, tolerance) {
  return getExcessDamage(stress.heat, tolerance.heat, MaterialStressConfig.damagePerExcessSecond.heat)
    + getExcessDamage(stress.pressure, tolerance.pressure, MaterialStressConfig.damagePerExcessSecond.pressure)
    + getExcessDamage(stress.vibration, tolerance.vibration, MaterialStressConfig.damagePerExcessSecond.vibration)
    + getExcessDamage(stress.acceleration, tolerance.acceleration, MaterialStressConfig.damagePerExcessSecond.acceleration);
}

function getExcessDamage(value, tolerance, scale) {
  return Math.max(0, value - tolerance) * scale;
}
