export const EnemyAiConfig = Object.freeze({
  standoffRangeRatio: 0.7,
  fallbackRange: 480,
  approachGain: 0.9,
  maxApproachSpeed: 70,
  separation: Object.freeze({
    radius: 160,
    strength: 120
  }),
  avoid: Object.freeze({
    lookaheadSeconds: 2.5,
    clearance: 150,
    strength: 120
  }),
  speedErrorForFullThrottle: 25,
  settleSpeedError: 3,
  noseAlignmentSpeedError: 30
});
