import { BodyKind, Component } from "../ecs/components.js";
import { addComponent, getComponent, getComponents, queryEntities, removeComponent, removeEntity } from "../ecs/world.js";

export function removeDestroyedShips(world) {
  const destroyed = [];
  for (const [entity, bodyKind] of getComponents(world, Component.BodyKind)) {
    if (bodyKind.value !== BodyKind.Ship) {
      continue;
    }

    const health = getComponent(world, entity, Component.Health);
    if (health && health.current <= 0) {
      destroyed.push(entity);
    }
  }

  for (const ship of destroyed) {
    promoteReplacementFlagship(world, ship, destroyed);

    for (const part of queryEntities(world, [Component.Parent])) {
      if (getComponent(world, part, Component.Parent).entity === ship) {
        removeEntity(world, part);
      }
    }

    removeEntity(world, ship);
  }
}

function promoteReplacementFlagship(world, ship, destroyed) {
  const player = getComponent(world, ship, Component.PlayerControlled);
  if (!player) {
    return;
  }

  const survivors = queryEntities(world, [Component.FleetMember])
    .filter((entity) => getComponent(world, entity, Component.FleetMember).flagship === ship
      && !destroyed.includes(entity))
    .sort((a, b) => getComponent(world, a, Component.FleetMember).slotIndex
      - getComponent(world, b, Component.FleetMember).slotIndex);
  const promoted = survivors[0];
  if (promoted === undefined) {
    return;
  }

  removeComponent(world, promoted, Component.FleetMember);
  addComponent(world, promoted, Component.PlayerControlled, { inputId: player.inputId });
  for (const member of survivors.slice(1)) {
    getComponent(world, member, Component.FleetMember).flagship = promoted;
  }
}
