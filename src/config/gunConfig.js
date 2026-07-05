export const GunModelConfig = Object.freeze({
  maxHealth: 25,
  range: 480,
  fireCooldownSeconds: 5,
  energyPerShot: 2,
  heatPerShot: 9,
  heatResumeRatio: 0.5,
  projectileSpeed: 260,
  projectileDamage: 8,
  projectileMass: 0.05,
  projectileLifetimeSeconds: 2.5
});

export const GunViewConfig = Object.freeze({
  localX: 20,
  localY: 0,
  radius: 6,
  barrelLength: 16,
  projectileRadius: 3,
  lockOn: Object.freeze({
    color: "rgba(248, 113, 113, 0.9)",
    radiusOffset: 14,
    cornerLength: 10,
    lineWidth: 2
  })
});
