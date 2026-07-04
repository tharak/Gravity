import { SpaceMapModelConfig } from "../config/spaceMapConfig.js";
import { createRandom, deriveRegionSeed } from "../core/random.js";

const minSiteSpacing = 1e-3;

export function generateSpaceMap(model = SpaceMapModelConfig) {
  const random = createRandom(model.seed);
  let sites = scatterSites(random, model);
  let polygons = computeVoronoiCells(sites, model.bounds);

  for (let iteration = 0; iteration < model.relaxationIterations; iteration += 1) {
    sites = polygons.map(polygonCentroid);
    polygons = computeVoronoiCells(sites, model.bounds);
  }

  const regions = sites.map((site, index) => Object.freeze({
    index,
    seed: deriveRegionSeed(model.seed, index),
    site: Object.freeze({ x: site.x, y: site.y }),
    polygon: Object.freeze(polygons[index].map((vertex) => Object.freeze({ x: vertex.x, y: vertex.y })))
  }));

  return Object.freeze({
    seed: model.seed,
    bounds: model.bounds,
    regions: Object.freeze(regions)
  });
}

export function findRegionAt(spaceMap, point) {
  let nearest;
  let nearestDistance = Infinity;
  for (const region of spaceMap.regions) {
    const dx = point.x - region.site.x;
    const dy = point.y - region.site.y;
    const distance = dx * dx + dy * dy;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = region;
    }
  }
  return nearest;
}

function scatterSites(random, model) {
  const { bounds, siteMargin, regionCount } = model;
  const width = bounds.maxX - bounds.minX - siteMargin * 2;
  const height = bounds.maxY - bounds.minY - siteMargin * 2;
  const sites = [];

  while (sites.length < regionCount) {
    const candidate = {
      x: bounds.minX + siteMargin + random() * width,
      y: bounds.minY + siteMargin + random() * height
    };
    const tooClose = sites.some((site) => Math.hypot(site.x - candidate.x, site.y - candidate.y) < minSiteSpacing);
    if (!tooClose) {
      sites.push(candidate);
    }
  }

  return sites;
}

function computeVoronoiCells(sites, bounds) {
  return sites.map((site) => {
    let polygon = [
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.maxY },
      { x: bounds.minX, y: bounds.maxY }
    ];

    for (const other of sites) {
      if (other === site || polygon.length === 0) {
        continue;
      }
      polygon = clipByBisector(polygon, site, other);
    }

    return polygon;
  });
}

function clipByBisector(polygon, site, other) {
  const direction = { x: other.x - site.x, y: other.y - site.y };
  const midpoint = { x: (site.x + other.x) / 2, y: (site.y + other.y) / 2 };
  const side = (point) => (point.x - midpoint.x) * direction.x + (point.y - midpoint.y) * direction.y;

  const clipped = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentSide = side(current);
    const nextSide = side(next);

    if (currentSide <= 0) {
      clipped.push(current);
    }
    if ((currentSide <= 0) !== (nextSide <= 0)) {
      const t = currentSide / (currentSide - nextSide);
      clipped.push({
        x: current.x + (next.x - current.x) * t,
        y: current.y + (next.y - current.y) * t
      });
    }
  }

  return clipped;
}

function polygonCentroid(polygon) {
  let area = 0;
  let x = 0;
  let y = 0;

  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const cross = current.x * next.y - next.x * current.y;
    area += cross;
    x += (current.x + next.x) * cross;
    y += (current.y + next.y) * cross;
  }

  area /= 2;
  if (Math.abs(area) < 1e-9) {
    return { x: polygon[0]?.x ?? 0, y: polygon[0]?.y ?? 0 };
  }

  return { x: x / (6 * area), y: y / (6 * area) };
}
