export const SpaceMapModelConfig = Object.freeze({
  seed: 1337,
  regionCount: 18,
  relaxationIterations: 2,
  bounds: Object.freeze({ minX: -640, minY: -400, maxX: 640, maxY: 400 }),
  siteMargin: 40
});

export const SpaceMapViewConfig = Object.freeze({
  padding: 60,
  backgroundColor: "#04060d",
  regionFillAlpha: 0.16,
  hoverFillAlpha: 0.34,
  conqueredFillColor: "#86efac",
  conqueredFillAlpha: 0.32,
  regionPalette: Object.freeze(["#7dd3fc", "#ffd166", "#b4f8c8", "#f4a3c0", "#c4b5fd", "#9ad1d4"]),
  borderColor: "rgba(233, 238, 248, 0.55)",
  borderWidth: 1.5,
  siteColor: "#f5f8ff",
  siteRadius: 5,
  labelColor: "rgba(233, 238, 248, 0.85)",
  labelFont: "13px 'Segoe UI', sans-serif",
  labelOffsetY: 18,
  starCount: 90,
  starSeedOffset: 1,
  starColor: "rgba(233, 238, 248, 0.7)",
  starMaxRadius: 1.4
});
