export function vec2(x = 0, y = 0) {
  return { x, y };
}

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v, scalar) {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function magnitudeSquared(v) {
  return v.x * v.x + v.y * v.y;
}

export function magnitude(v) {
  return Math.sqrt(magnitudeSquared(v));
}

export function normalize(v) {
  const length = magnitude(v);
  if (length === 0) {
    return vec2();
  }
  return scale(v, 1 / length);
}

export function distance(a, b) {
  return magnitude(subtract(a, b));
}
