import { BodyKind, Component } from "../ecs/components.js";
import { getComponent, getComponents, queryEntities, removeEntity } from "../ecs/world.js";

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
    for (const part of queryEntities(world, [Component.Parent])) {
      if (getComponent(world, part, Component.Parent).entity === ship) {
        removeEntity(world, part);
      }
    }

    removeEntity(world, ship);
  }
}
