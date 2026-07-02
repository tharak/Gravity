import { SimulationConfig } from "../config/simulationConfig.js";
import { Component } from "../ecs/components.js";
import { applyGravity } from "../systems/gravitySystem.js";
import { resolveCollisions } from "../systems/collisionSystem.js";
import { integrateMotion } from "../systems/integrationSystem.js";
import { applyPlayerInput } from "../systems/playerInputSystem.js";
import { recordTrails } from "../systems/trailSystem.js";

export const defaultSimulationConfig = SimulationConfig;

export function createSimulation(world, config = {}) {
  const settings = { ...defaultSimulationConfig, ...config };
  const inputById = settings.inputById ?? {};
  let accumulator = 0;

  return {
    settings,
    step(deltaSeconds) {
      accumulator += Math.min(deltaSeconds, settings.maxFrameDeltaSeconds);
      while (accumulator >= settings.fixedDeltaSeconds) {
        applyGravity(world, settings);
        applyPlayerInput(world, inputById, settings.fixedDeltaSeconds);
        integrateMotion(world, settings.fixedDeltaSeconds);
        resolveCollisions(world);
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
