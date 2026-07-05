import { FleetFormationList } from "../config/fleetConfig.js";
import { LabelConfig } from "../config/labelConfig.js";
import { SpaceMapViewConfig } from "../config/spaceMapConfig.js";
import { createRandom } from "../core/random.js";
import { worldToScreen } from "./camera.js";

export function renderSpaceMap(context, canvas, spaceMap, camera, options = {}) {
  const view = SpaceMapViewConfig;
  context.fillStyle = view.backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawStars(context, canvas, spaceMap, view);

  for (const region of spaceMap.regions) {
    drawRegion(context, canvas, camera, region, view, {
      hovered: region.index === options.hoveredRegionIndex,
      conquered: options.conqueredRegionIndexes?.has(region.index) ?? false,
      intel: options.sectorIntel?.get(region.index)
    });
  }
}

function drawStars(context, canvas, spaceMap, view) {
  const random = createRandom(spaceMap.seed + view.starSeedOffset);
  context.fillStyle = view.starColor;
  for (let index = 0; index < view.starCount; index += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const radius = 0.4 + random() * view.starMaxRadius;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawRegion(context, canvas, camera, region, view, state) {
  if (region.polygon.length < 3) {
    return;
  }

  context.beginPath();
  for (const [index, vertex] of region.polygon.entries()) {
    const point = worldToScreen(camera, canvas, vertex);
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  }
  context.closePath();

  context.save();
  if (state.conquered) {
    context.globalAlpha = view.conqueredFillAlpha;
    context.fillStyle = view.conqueredFillColor;
  } else {
    context.globalAlpha = state.hovered ? view.hoverFillAlpha : view.regionFillAlpha;
    context.fillStyle = view.regionPalette[region.index % view.regionPalette.length];
  }
  context.fill();
  context.restore();

  context.strokeStyle = view.borderColor;
  context.lineWidth = view.borderWidth;
  context.stroke();

  const site = worldToScreen(camera, canvas, region.site);
  context.fillStyle = view.siteColor;
  context.beginPath();
  context.arc(site.x, site.y, view.siteRadius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = view.labelColor;
  context.font = view.labelFont;
  context.textAlign = "center";
  const suffix = state.conquered ? LabelConfig.spaceMap.conqueredSuffix : "";
  context.fillText(`${LabelConfig.spaceMap.regionPrefix}${region.index + 1}${suffix}`, site.x, site.y + view.labelOffsetY);

  if (state.intel) {
    context.fillStyle = view.intelColor;
    context.font = view.intelFont;
    context.fillText(formatSectorIntel(state.intel), site.x, site.y + view.intelOffsetY);
  }
}

function formatSectorIntel(intel) {
  const labels = LabelConfig.spaceMap.intel;
  const formation = FleetFormationList.find((candidate) => candidate.id === intel.formation)?.label ?? "";
  const resources = intel.resourcePlanetCount > 0 ? ` ${labels.resources}${intel.resourcePlanetCount}` : "";
  return `${labels.enemies}${intel.enemyCount} ${formation}${labels.separator}${labels.planets}${intel.planetCount}${resources}`;
}
