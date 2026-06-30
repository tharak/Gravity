import { BodyKind, Component } from "../ecs/components.js";
import { addComponent, createEntity } from "../ecs/world.js";

export function createBody(world, body) {
  const entity = createEntity(world);
  addComponent(world, entity, Component.BodyKind, { value: body.kind });
  addComponent(world, entity, Component.Position, { x: body.x, y: body.y });
  addComponent(world, entity, Component.Velocity, { x: body.vx ?? 0, y: body.vy ?? 0 });
  addComponent(world, entity, Component.Acceleration, { x: 0, y: 0 });
  addComponent(world, entity, Component.Mass, { value: body.mass });
  addComponent(world, entity, Component.Radius, { value: body.radius });
  addComponent(world, entity, Component.OrbitTrail, { points: [] });

  if (body.playerControlled) {
    addComponent(world, entity, Component.PlayerControlled, { inputId: body.playerControlled });
  }

  if (body.thrust) {
    addComponent(world, entity, Component.Thrust, { acceleration: body.thrust.acceleration });
  }

  if (body.resources) {
    addComponent(world, entity, Component.Resource, { ...body.resources });
  }

  return entity;
}

export function seedStarterSystem(world) {
  createBody(world, {
    kind: BodyKind.Star,
    x: 0,
    y: 0,
    mass: 9000,
    radius: 22
  });

  createBody(world, {
    kind: BodyKind.Planet,
    x: 210,
    y: 0,
    vx: 0,
    vy: 55,
    mass: 28,
    radius: 10
  });

  createBody(world, {
    kind: BodyKind.ResourcePlanet,
    x: -330,
    y: 0,
    vx: 0,
    vy: -44,
    mass: 46,
    radius: 13,
    resources: { minerals: 180, fuel: 95 }
  });

  createBody(world, {
    kind: BodyKind.Ship,
    x: 0,
    y: -285,
    vx: 45,
    vy: 0,
    mass: 2,
    radius: 7,
    playerControlled: "player-one",
    thrust: { acceleration: 96 }
  });

  createBody(world, {
    kind: BodyKind.Ship,
    x: 0,
    y: 360,
    vx: -39,
    vy: 0,
    mass: 2,
    radius: 6
  });
}
