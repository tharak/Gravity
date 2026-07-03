export function createWorld() {
  return {
    nextEntityId: 1,
    entities: new Set(),
    components: new Map(),
    time: 0
  };
}

export function createEntity(world) {
  const entity = world.nextEntityId;
  world.nextEntityId += 1;
  world.entities.add(entity);
  return entity;
}

export function removeEntity(world, entity) {
  world.entities.delete(entity);
  for (const components of world.components.values()) {
    components.delete(entity);
  }
}

export function addComponent(world, entity, type, data) {
  if (!world.components.has(type)) {
    world.components.set(type, new Map());
  }
  world.components.get(type).set(entity, data);
  return data;
}

export function removeComponent(world, entity, type) {
  world.components.get(type)?.delete(entity);
}

export function getComponent(world, entity, type) {
  return world.components.get(type)?.get(entity);
}

export function getComponents(world, type) {
  return world.components.get(type) ?? new Map();
}

export function hasComponents(world, entity, types) {
  return types.every((type) => getComponent(world, entity, type) !== undefined);
}

export function queryEntities(world, types) {
  return [...world.entities].filter((entity) => hasComponents(world, entity, types));
}
