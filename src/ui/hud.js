import { LabelConfig } from "../config/labelConfig.js";
import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { ControllerMode, DirectionOrders, SpeedOrders } from "../input/playerInput.js";

export function createHudView(root = document) {
  return {
    time: root.querySelector("#hud-time"),
    entities: root.querySelector("#hud-entities"),
    status: root.querySelector("#hud-status"),
    map: root.querySelector("#hud-map")
  };
}

export function updateHud(view, world, activeMap, playerInput) {
  view.time.textContent = `${world.time.toFixed(1)}s`;
  view.entities.textContent = String(world.entities.size);
  view.status.textContent = getStatusText(world, activeMap, playerInput);
  view.map.textContent = activeMap.label;
}

function getStatusText(world, activeMap, playerInput) {
  if (activeMap.isMenu) {
    return LabelConfig.status.chooseLevel;
  }

  if (playerInput.controllerMode === ControllerMode.Automatic) {
    const speed = SpeedOrders.find((order) => order.id === playerInput.speedOrder)?.label ?? playerInput.speedOrder;
    const direction = DirectionOrders.find((order) => order.id === playerInput.targetDirection)?.label ?? playerInput.targetDirection;
    return LabelConfig.status.auto + " " + speed + " " + direction;
  }

  if (playerInput.activeSlots.size > 0) {
    return LabelConfig.status.thrusting;
  }

  const player = queryEntities(world, [Component.PlayerControlled, Component.Velocity])[0];
  if (player === undefined) {
    return LabelConfig.status.running;
  }

  const velocity = getComponent(world, player, Component.Velocity);
  return Math.hypot(velocity.x, velocity.y) > 2 ? LabelConfig.status.coasting : LabelConfig.status.running;
}
