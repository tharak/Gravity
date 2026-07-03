import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { SHIP_FACING_UP } from "../game/factory.js";
import { applyThrusterCommandToShip, createPilotThrusterCommand, resetThrusterPower } from "../game/flightControl.js";

export function applyPlayerInput(world, inputById, deltaSeconds = 0) {
  resetThrusterPower(world);

  for (const ship of queryEntities(world, [Component.Acceleration, Component.PlayerControlled])) {
    const player = getComponent(world, ship, Component.PlayerControlled);
    const input = inputById[player.inputId];
    const rotation = getComponent(world, ship, Component.Rotation)?.angle ?? SHIP_FACING_UP;
    const command = createPilotThrusterCommand(world, ship, input, deltaSeconds);

    applyThrusterCommandToShip(world, ship, command, rotation);
  }
}
