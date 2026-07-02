import { getWorldBounds } from "../game/worldBounds.js";

export function createCamera() {
  return {
    x: 0,
    y: 0,
    scale: 1
  };
}

export function fitCameraToWorld(camera, canvas, world, padding = 180) {
  const bounds = getWorldBounds(world);
  if (!bounds) {
    camera.x = 0;
    camera.y = 0;
    camera.scale = 1;
    return;
  }

  const width = Math.max(360, bounds.maxX - bounds.minX);
  const height = Math.max(240, bounds.maxY - bounds.minY);
  const availableWidth = Math.max(1, canvas.width - padding * 2);
  const availableHeight = Math.max(1, canvas.height - padding * 2);

  camera.x = bounds.minX + width / 2;
  camera.y = bounds.minY + height / 2;
  camera.scale = Math.min(availableWidth / width, availableHeight / height);
}

export function worldToScreen(camera, canvas, point) {
  return {
    x: canvas.width / 2 + (point.x - camera.x) * camera.scale,
    y: canvas.height / 2 + (point.y - camera.y) * camera.scale
  };
}
