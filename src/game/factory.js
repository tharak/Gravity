import { BodyKind, Component } from "../ecs/components.js";
import { addComponent, createEntity } from "../ecs/world.js";

export function createBody(world, body) {
  const entity = createEntity(world);
  addComponent(world, entity, Component.BodyKind, { value: body.kind });
  addComponent(world, entity, Component.Position, { x: body.x, y: body.y });
  addComponent(world, entity, Component.Mass, { value: body.mass });
  addComponent(world, entity, Component.Radius, { value: body.radius });

  if (body.static) {
    addComponent(world, entity, Component.StaticBody, { value: true });
  } else {
    addComponent(world, entity, Component.Velocity, { x: body.vx ?? 0, y: body.vy ?? 0 });
    addComponent(world, entity, Component.Acceleration, { x: 0, y: 0 });
    addComponent(world, entity, Component.OrbitTrail, { points: [] });
  }

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
    kind: BodyKind.Planet,
    x: 320,
    y: 140,
    mass: 18000,
    radius: 24,
    static: true
  });

  createBody(world, {
    kind: BodyKind.ResourcePlanet,
    x: -280,
    y: 80,
    mass: 22000,
    radius: 29,
    static: true,
    resources: { minerals: 180, fuel: 95 }
  });

  createBody(world, {
    kind: BodyKind.Station,
    x: -80,
    y: 310,
    mass: 4000,
    radius: 16,
    static: true
  });

  createBody(world, {
    kind: BodyKind.Ship,
    x: 80,
    y: -210,
    vx: 10,
    vy: 0,
    mass: 2,
    radius: 7,
    playerControlled: "player-one",
    thrust: { acceleration: 140 }
  });

  createBody(world, {
    kind: BodyKind.Ship,
    x: 245,
    y: -180,
    vx: -8,
    vy: 6,
    mass: 2,
    radius: 6
  });
}
