export const MaterialStressConfig = Object.freeze({
  defaultHealth: 20,
  tolerances: Object.freeze({
    heat: 100,
    pressure: 100,
    vibration: 80,
    acceleration: 140
  }),
  heatGainPerPowerSecond: 18,
  heatDissipationPerSecond: 6,
  collisionPressurePerDamage: 8,
  pressureDissipationPerSecond: 12,
  vibrationFromAngularVelocity: 18,
  accelerationLoadMultiplier: 1,
  damagePerExcessSecond: Object.freeze({
    heat: 0.08,
    pressure: 0.08,
    vibration: 0.05,
    acceleration: 0.04
  })
});
