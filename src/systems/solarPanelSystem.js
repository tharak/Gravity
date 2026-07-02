import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";

export function applySolarPanels(world, deltaSeconds) {
  for (const entity of queryEntities(world, [Component.SolarPanel, Component.Health])) {
    const health = getComponent(world, entity, Component.Health);
    if (health.current <= 0) {
      continue;
    }

    const solarPanel = getComponent(world, entity, Component.SolarPanel);
    const battery = getComponent(world, solarPanel.shipEntity, Component.Battery);
    if (!battery || deltaSeconds <= 0) {
      continue;
    }

    const recharge = solarPanel.batteryRechargeRate * deltaSeconds;
    battery.charge = Math.min(battery.capacity, battery.charge + recharge);
    battery.solarRechargeRate = solarPanel.batteryRechargeRate;
  }
}
