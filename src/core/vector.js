export function vec2(x = 0, y = 0) {
  return { x, y };
}

export function rotate(x, y, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

export function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

export function clamp01(value) {
  return clamp(value, 0, 1);
}

export function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
