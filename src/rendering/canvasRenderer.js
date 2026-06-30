import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { bodyColors } from "./colors.js";
import { worldToScreen } from "./camera.js";

export function renderWorld(context, canvas, world, camera) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(context, canvas, camera);
  drawTrails(context, canvas, world, camera);
  drawBodies(context, canvas, world, camera);
}

function drawGrid(context, canvas, camera) {
  context.save();
  context.strokeStyle = "rgba(139, 159, 190, 0.12)";
  context.lineWidth = 1;
  const spacing = 80 * camera.zoom;
  const offsetX = canvas.width / 2 - camera.x * camera.zoom;
  const offsetY = canvas.height / 2 - camera.y * camera.zoom;

  for (let x = offsetX % spacing; x < canvas.width; x += spacing) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }

  for (let y = offsetY % spacing; y < canvas.height; y += spacing) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
  context.restore();
}

function drawTrails(context, canvas, world, camera) {
  context.save();
  context.lineWidth = 1.5;
  for (const entity of queryEntities(world, [Component.BodyKind, Component.OrbitTrail])) {
    const kind = getComponent(world, entity, Component.BodyKind).value;
    const trail = getComponent(world, entity, Component.OrbitTrail).points;
    if (trail.length < 2) {
      continue;
    }

    context.strokeStyle = `${bodyColors[kind]}55`;
    context.beginPath();
    const start = worldToScreen(camera, canvas, trail[0]);
    context.moveTo(start.x, start.y);
    for (let i = 1; i < trail.length; i += 1) {
      const point = worldToScreen(camera, canvas, trail[i]);
      context.lineTo(point.x, point.y);
    }
    context.stroke();
  }
  context.restore();
}

function drawBodies(context, canvas, world, camera) {
  context.save();
  for (const entity of queryEntities(world, [Component.BodyKind, Component.Position, Component.Radius])) {
    const kind = getComponent(world, entity, Component.BodyKind).value;
    const position = getComponent(world, entity, Component.Position);
    const radius = getComponent(world, entity, Component.Radius).value * camera.zoom;
    const screen = worldToScreen(camera, canvas, position);

    context.fillStyle = bodyColors[kind];
    context.beginPath();
    context.arc(screen.x, screen.y, Math.max(radius, 3), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}
