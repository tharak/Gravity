export function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInRange(random, range) {
  return range.min + random() * (range.max - range.min);
}

export function randomInt(random, range) {
  return range.min + Math.floor(random() * (range.max - range.min + 1));
}

export function randomPick(random, items) {
  return items[Math.floor(random() * items.length)];
}

export function hashCombine(seed, value) {
  let hash = (seed ^ Math.imul((value >>> 0) + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35) >>> 0;
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return hash;
}

export function deriveRegionSeed(mapSeed, regionIndex) {
  return hashCombine(mapSeed >>> 0, regionIndex);
}
