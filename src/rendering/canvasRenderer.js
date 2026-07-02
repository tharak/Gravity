import { BodyKind, Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { WORLD_NORTH_VECTOR } from "../game/navigation.js";
import { bodyColors } from "./colors.js";
import { worldToScreen } from "./camera.js";

export function renderWorld(context, canvas, world, camera, options = {}) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(context, canvas, camera);
  drawWorldNorthIndicator(context, canvas);
  drawTrails(context, canvas, world, camera);
  drawBodies(context, canvas, world, camera, options.lightPosition);
  drawDamagePopups(context, canvas, world, camera);
}

function drawGrid(context, canvas, camera) {
  context.save();
  context.strokeStyle = "rgba(139, 159, 190, 0.12)";
  context.lineWidth = 1;
  const spacing = 80 * camera.scale;
  const offsetX = canvas.width / 2 - camera.x * camera.scale;
  const offsetY = canvas.height / 2 - camera.y * camera.scale;

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

function drawWorldNorthIndicator(context, canvas) {
  const scale = Math.max(1, Math.min(1.4, canvas.width / 1280));
  const origin = { x: canvas.width - 58 * scale, y: 58 * scale };
  const length = 34 * scale;
  const tip = {
    x: origin.x + WORLD_NORTH_VECTOR.x * length,
    y: origin.y + WORLD_NORTH_VECTOR.y * length
  };

  context.save();
  context.lineWidth = 2 * scale;
  context.strokeStyle = "rgba(125, 211, 252, 0.92)";
  context.fillStyle = "rgba(125, 211, 252, 0.92)";
  context.beginPath();
  context.arc(origin.x, origin.y, 3.5 * scale, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.moveTo(origin.x, origin.y);
  context.lineTo(tip.x, tip.y);
  context.stroke();
  context.beginPath();
  context.moveTo(tip.x, tip.y);
  context.lineTo(tip.x - 6 * scale, tip.y + 10 * scale);
  context.lineTo(tip.x + 6 * scale, tip.y + 10 * scale);
  context.closePath();
  context.fill();
  context.font = String(12 * scale) + "px ui-sans-serif, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillText("WORLD N", origin.x, origin.y + 8 * scale);
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

function drawBodies(context, canvas, world, camera, lightPosition) {
  context.save();
  for (const entity of queryEntities(world, [Component.BodyKind, Component.Position, Component.Radius])) {
    const kind = getComponent(world, entity, Component.BodyKind).value;
    const position = getComponent(world, entity, Component.Position);
    const radius = getComponent(world, entity, Component.Radius).value * camera.scale;
    const screen = worldToScreen(camera, canvas, position);
    const shipFrame = getComponent(world, entity, Component.ShipFrame);

    if (kind === BodyKind.Ship && shipFrame) {
      const rotation = getComponent(world, entity, Component.Rotation)?.angle ?? 0;
      drawShip(context, world, entity, screen, shipFrame, camera, rotation);
      continue;
    }

    drawBodyCircle(context, screen, Math.max(radius, 3), bodyColors[kind], kind, position, lightPosition);
  }
  context.restore();
}

function drawShip(context, world, ship, screen, frame, camera, rotation) {
  const width = frame.width * camera.scale;
  const height = frame.height * camera.scale;
  const isPlayer = getComponent(world, ship, Component.PlayerControlled) !== undefined;

  context.save();
  context.translate(screen.x, screen.y);
  context.rotate(rotation);
  context.fillStyle = bodyColors[BodyKind.Ship];
  context.strokeStyle = isPlayer ? "#ffffff" : "rgba(255, 255, 255, 0.35)";
  context.lineWidth = isPlayer ? 2 : 1;
  context.beginPath();
  context.rect(-width / 2, -height / 2, width, height);
  context.fill();
  context.stroke();

  drawThrusters(context, world, ship, camera);
  context.restore();
}

function drawThrusters(context, world, ship, camera) {
  for (const entity of queryEntities(world, [Component.Thruster])) {
    const thruster = getComponent(world, entity, Component.Thruster);
    if (thruster.shipEntity !== ship) {
      continue;
    }

    const x = thruster.localX * camera.scale;
    const y = thruster.localY * camera.scale;
    const radius = Math.max((5 + thruster.power * 4) * camera.scale, 8);

    if (thruster.power > 0) {
      const pulse = thruster.stabilizing ? 0.65 + 0.35 * Math.sin(world.time * 18 + thruster.number) : 1;
      const glowRadius = radius + (8 + 7 * pulse) * camera.scale * thruster.power;
      context.fillStyle = thruster.stabilizing ? `${thruster.color}77` : `${thruster.color}55`;
      context.beginPath();
      context.arc(x, y, glowRadius, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = thruster.color;
    context.beginPath();
    context.arc(x, y, Math.max(radius, 3), 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#07111f";
    context.font = String(Math.max(10, 12 * camera.scale)) + "px ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(thruster.number), x, y);
  }
}

function drawDamagePopups(context, canvas, world, camera) {
  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = String(Math.max(12, 15 * camera.scale)) + "px ui-sans-serif, system-ui, sans-serif";
  for (const entity of queryEntities(world, [Component.DamagePopup])) {
    const popup = getComponent(world, entity, Component.DamagePopup);
    const age = world.time - popup.createdAt;
    if (age < 0 || age > popup.duration) {
      continue;
    }

    const progress = age / popup.duration;
    const screen = worldToScreen(camera, canvas, { x: popup.x, y: popup.y - progress * 34 });
    context.globalAlpha = 1 - progress;
    context.lineWidth = 4;
    context.strokeStyle = "rgba(7, 17, 31, 0.92)";
    context.fillStyle = "#ff667a";
    context.strokeText("-" + formatDamage(popup.damage), screen.x, screen.y);
    context.fillText("-" + formatDamage(popup.damage), screen.x, screen.y);
  }
  context.restore();
}

function formatDamage(damage) {
  return damage >= 10 ? String(Math.round(damage)) : damage.toFixed(1);
}

function drawBodyCircle(context, screen, radius, color, kind, position, lightPosition) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
  context.fill();

  if (!lightPosition || !isShadedKind(kind)) {
    return;
  }

  const dx = position.x - lightPosition.x;
  const dy = position.y - lightPosition.y;
  const distance = Math.hypot(dx, dy) || 1;
  const lightX = -dx / distance;
  const lightY = -dy / distance;
  const litX = screen.x + lightX * radius;
  const litY = screen.y + lightY * radius;
  const darkX = screen.x - lightX * radius;
  const darkY = screen.y - lightY * radius;
  const shadow = context.createLinearGradient(litX, litY, darkX, darkY);

  shadow.addColorStop(0, "rgba(255, 255, 255, 0.20)");
  shadow.addColorStop(0.42, "rgba(255, 255, 255, 0.02)");
  shadow.addColorStop(1, "rgba(0, 0, 0, 0.48)");

  context.fillStyle = shadow;
  context.beginPath();
  context.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
  context.fill();
}

function isShadedKind(kind) {
  return kind === BodyKind.Planet || kind === BodyKind.ResourcePlanet;
}
