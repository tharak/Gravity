import { BodyKind, Component } from "../ecs/components.js";
import { getComponent, getComponents } from "../ecs/world.js";

export function findNearestOpposingShip(world, ship, origin) {
  const faction = getComponent(world, ship, Component.Faction)?.id;
  let nearest;

  for (const [entity, bodyKind] of getComponents(world, Component.BodyKind)) {
    if (entity === ship || bodyKind.value !== BodyKind.Ship) {
      continue;
    }

    if (faction !== undefined && getComponent(world, entity, Component.Faction)?.id === faction) {
      continue;
    }

    const position = getComponent(world, entity, Component.Position);
    if (!position) {
      continue;
    }

    const distance = Math.hypot(position.x - origin.x, position.y - origin.y);
    if (nearest === undefined || distance < nearest.distance) {
      nearest = { entity, x: position.x, y: position.y, distance };
    }
  }

  return nearest;
}
