export const FlightControlConfig = Object.freeze({
  stop: Object.freeze({
    minLinearSpeed: 1,
    alignmentThreshold: 0.35,
    fullPowerSpeed: 45
  }),
  turn: Object.freeze({
    angleErrorGain: 1.45,
    angularVelocityGain: 0.35,
    dampingGain: 0.8,
    minPower: 0.04
  }),
  minMainThrusterPower: 0.02
});
