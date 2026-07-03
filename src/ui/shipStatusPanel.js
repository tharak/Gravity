import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";

export function createShipStatusView(root = document) {
  return {
    batteryPercent: root.querySelector("#battery-percent"),
    shipHealth: root.querySelector("#ship-health"),
    batteryBars: [...root.querySelectorAll(".battery-widget__bar")]
  };
}

export function updateShipStatus(view, world) {
  const player = queryEntities(world, [Component.PlayerControlled, Component.Battery])[0];
  if (player === undefined) {
    view.batteryPercent.textContent = "--%";
    view.shipHealth.textContent = "--/--";
    view.batteryBars.forEach((bar) => bar.classList.remove("is-filled"));
    return;
  }

  const health = getComponent(world, player, Component.Health);
  view.shipHealth.textContent = health ? formatHealth(health) : "--/--";

  const battery = getComponent(world, player, Component.Battery);
  const percent = battery.capacity > 0 ? Math.round((battery.charge / battery.capacity) * 100) : 0;
  const filledBars = Math.ceil(percent / 20);
  view.batteryPercent.textContent = String(percent) + "%";
  view.batteryBars.forEach((bar, index) => {
    bar.classList.toggle("is-filled", index < filledBars);
  });
}

function formatHealth(health) {
  return formatHealthValue(health.current) + "/" + formatHealthValue(health.max);
}

function formatHealthValue(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
