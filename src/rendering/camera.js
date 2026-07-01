import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";

export function createCamera() {
  return {
    x: 0,
    y: 0,
    scale: 1
  };
}

export function fitCameraToWorld(camera, canvas, world, padding = 180) {
  const bodies = queryEntities(world, [Component.Position, Component.Radius]);
  if (bodies.length === 0) {
    camera.x = 0;
    camera.y = 0;
    camera.scale = 1;
    return;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const entity of bodies) {
    const position = getComponent(world, entity, Component.Position);
    const radius = getComponent(world, entity, Component.Radius).value;
    minX = Math.min(minX, position.x - radius);
    minY = Math.min(minY, position.y - radius);
    maxX = Math.max(maxX, position.x + radius);
    maxY = Math.max(maxY, position.y + radius);
  }

  const width = Math.max(360, maxX - minX);
  const height = Math.max(240, maxY - minY);
  const availableWidth = Math.max(1, canvas.width - padding * 2);
  const availableHeight = Math.max(1, canvas.height - padding * 2);

  camera.x = minX + width / 2;
  camera.y = minY + height / 2;
  camera.scale = Math.min(availableWidth / width, availableHeight / height);
}

export function worldToScreen(camera, canvas, point) {
  return {
    x: canvas.width / 2 + (point.x - camera.x) * camera.scale,
    y: canvas.height / 2 + (point.y - camera.y) * camera.scale
  };
}
