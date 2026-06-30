export function createCamera(canvas) {
  return {
    x: 0,
    y: 0,
    zoom: Math.min(canvas.width, canvas.height) / 900
  };
}

export function worldToScreen(camera, canvas, point) {
  return {
    x: canvas.width / 2 + (point.x - camera.x) * camera.zoom,
    y: canvas.height / 2 + (point.y - camera.y) * camera.zoom
  };
}
