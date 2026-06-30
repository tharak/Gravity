import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";

export function applyPlayerInput(world, inputById) {
  for (const entity of queryEntities(world, [
    Component.Acceleration,
    Component.PlayerControlled,
    Component.Thrust
  ])) {
    const acceleration = getComponent(world, entity, Component.Acceleration);
    const player = getComponent(world, entity, Component.PlayerControlled);
    const thrust = getComponent(world, entity, Component.Thrust);
    const input = inputById[player.inputId];

    if (!input?.active) {
      continue;
    }

    acceleration.x += input.x * thrust.acceleration * input.strength;
    acceleration.y += input.y * thrust.acceleration * input.strength;
  }
}
