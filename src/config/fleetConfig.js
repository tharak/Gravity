import { LabelConfig } from "./labelConfig.js";

export const FleetFormation = Object.freeze({
  Column: "column",
  Line: "line",
  Arrow: "arrow",
  Chevron: "chevron"
});

export const FleetFormationList = Object.freeze([
  Object.freeze({ id: FleetFormation.Column, ...LabelConfig.fleetFormations.column }),
  Object.freeze({ id: FleetFormation.Line, ...LabelConfig.fleetFormations.line }),
  Object.freeze({ id: FleetFormation.Arrow, ...LabelConfig.fleetFormations.arrow }),
  Object.freeze({ id: FleetFormation.Chevron, ...LabelConfig.fleetFormations.chevron })
]);

export const FleetModelConfig = Object.freeze({
  spacing: 180,
  arrive: Object.freeze({
    catchUpGain: 0.8,
    maxCatchUpSpeed: 40
  }),
  separation: Object.freeze({
    radius: 160,
    strength: 120
  }),
  avoid: Object.freeze({
    lookaheadSeconds: 2.5,
    clearance: 150,
    strength: 120
  }),
  headingSmoothingRate: 1.5,
  speedErrorForFullThrottle: 25,
  settleSpeedError: 3,
  noseAlignmentSpeedError: 30,
  noseAimRangeRatio: 1
});
