import { Component } from "../ecs/components.js";
import { applyGravity } from "../systems/gravitySystem.js";
import { integrateMotion } from "../systems/integrationSystem.js";
import { recordTrails } from "../systems/trailSystem.js";

export const defaultSimulationConfig = Object.freeze({
  fixedDeltaSeconds: 1 / 60,
  gravitationalConstant: 72,
  maxTrailLength: 220,
  softening: 16
});

export function createSimulation(world, config = {}) {
  const settings = { ...defaultSimulationConfig, ...config };
  let accumulator = 0;

  return {
    settings,
    step(deltaSeconds) {
      accumulator += Math.min(deltaSeconds, 0.25);
      while (accumulator >= settings.fixedDeltaSeconds) {
        applyGravity(world, settings);
        integrateMotion(world, settings.fixedDeltaSeconds);
        recordTrails(world, settings.maxTrailLength);
        accumulator -= settings.fixedDeltaSeconds;
      }
    }
  };
}

export function totalKineticEnergy(world) {
  let total = 0;
  const masses = world.components.get(Component.Mass) ?? new Map();
  for (const [entity, mass] of masses) {
    const velocity = world.components.get(Component.Velocity)?.get(entity);
    if (velocity) {
      total += 0.5 * mass.value * (velocity.x * velocity.x + velocity.y * velocity.y);
    }
  }
  return total;
}
