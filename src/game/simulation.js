import { SimulationConfig } from "../config/simulationConfig.js";
import { removeExpiredDamagePopups } from "./damage.js";
import { applyGravity } from "../systems/gravitySystem.js";
import { resolveCollisions } from "../systems/collisionSystem.js";
import { applyGuns } from "../systems/gunSystem.js";
import { integrateMotion } from "../systems/integrationSystem.js";
import { applyMaterialStress } from "../systems/materialStressSystem.js";
import { updateProjectiles } from "../systems/projectileSystem.js";
import { applySolarPanels } from "../systems/solarPanelSystem.js";
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
        applySolarPanels(world, settings.fixedDeltaSeconds);
        applyPlayerInput(world, inputById, settings.fixedDeltaSeconds);
        applyGuns(world, inputById, settings.fixedDeltaSeconds);
        applyMaterialStress(world, settings.fixedDeltaSeconds);
        integrateMotion(world, settings.fixedDeltaSeconds);
        updateProjectiles(world);
        resolveCollisions(world);
        removeExpiredDamagePopups(world);
        recordTrails(world, settings.maxTrailLength);
        accumulator -= settings.fixedDeltaSeconds;
      }
    }
  };
}
