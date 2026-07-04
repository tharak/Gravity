import assert from "node:assert/strict";
import test from "node:test";
import { BattleModelConfig, BattleViewConfig } from "../src/config/battleConfig.js";
import { CollisionConfig } from "../src/config/collisionConfig.js";
import { BatteryConfig } from "../src/config/batteryConfig.js";
import { EnemyAiConfig } from "../src/config/enemyConfig.js";
import { FleetFormation, FleetFormationList, FleetModelConfig } from "../src/config/fleetConfig.js";
import { FlightControlConfig } from "../src/config/flightControlConfig.js";
import { GunModelConfig, GunViewConfig } from "../src/config/gunConfig.js";
import { ShieldModelConfig, ShieldViewConfig } from "../src/config/shieldConfig.js";
import { LabelConfig } from "../src/config/labelConfig.js";
import { DefaultShipModelConfig, DefaultShipViewConfig, FleetBattleShipModelConfig, FleetBattleShipViewConfig, FleetTestShipModelConfig, FleetTestShipViewConfig, GravityTestShipModelConfig, GravityTestShipViewConfig, StarterShipModelConfig, StarterShipViewConfig, ThrusterModelConfig, ThrusterViewConfig } from "../src/config/shipConfig.js";
import { MaterialStressConfig } from "../src/config/materialStressConfig.js";
import { FleetBattlePlanetModelConfig, FleetBattlePlanetViewConfig, FleetTestPlanetModelConfig, FleetTestPlanetViewConfig, GravityTestPlanetModelConfig, GravityTestPlanetViewConfig } from "../src/config/planetConfig.js";
import { SolarPanelModelConfig, SolarPanelViewConfig } from "../src/config/solarPanelConfig.js";
import { SimulationConfig } from "../src/config/simulationConfig.js";
import { SpaceMapModelConfig, SpaceMapViewConfig } from "../src/config/spaceMapConfig.js";
import { SpeedOrderConfig, SpeedOrderList } from "../src/config/speedOrderConfig.js";
import { ThrusterSlot } from "../src/ecs/components.js";
import { SpeedOrder, SpeedOrders } from "../src/input/playerInput.js";

test("label config centralizes visible UI text", () => {
  assert.equal(LabelConfig.appTitle, "Gravity");
  assert.equal(LabelConfig.levelSelectTitle, "Choose Test Map");
  assert.equal(LabelConfig.readouts.worldNorthCanvas, "WORLD N");
  assert.equal(LabelConfig.speedOrders.Flank.label, "FLANK");
  assert.equal(LabelConfig.controls.acceleration, "Acceleration");
  assert.equal(LabelConfig.controls.accelerationOrder, "Acceleration order");
  assert.equal(LabelConfig.controls.locked, "LOCKED");
  assert.equal(LabelConfig.gameOver.title, "Game Over");
  assert.equal(LabelConfig.gameOver.retry, "Retry");
  assert.equal(LabelConfig.controllerModes.manualShort, "MAN");
  assert.equal(LabelConfig.directions.NorthEast.ariaLabel, "North east");
});

test("speed order config is the source for exported speed orders", () => {
  assert.equal(SpeedOrder.Full, SpeedOrderConfig.Full.id);
  assert.equal(SpeedOrder.Flank, SpeedOrderConfig.Flank.id);
  assert.equal(SpeedOrderConfig.Full.ariaLabel, "Full acceleration");
  assert.equal(SpeedOrderConfig.Full.powerConsumptionWeight, 1.25);
  assert.equal(SpeedOrderConfig.Flank.powerConsumptionWeight, 1.5);
  assert.deepEqual(SpeedOrders, SpeedOrderList);
});

test("ship and thruster configs separate model and view values", () => {
  assert.equal(DefaultShipModelConfig.maxHealth, 100);
  assert.equal(DefaultShipViewConfig.radius, 48);
  assert.equal(DefaultShipViewConfig.frame.width, 88);
  assert.deepEqual(Object.keys(StarterShipModelConfig), ["mass", "playerControlled"]);
  assert.equal(StarterShipViewConfig.frame.width, 94);

  const mainModel = ThrusterModelConfig.find((thruster) => thruster.slot === ThrusterSlot.MainBack);
  const mainView = ThrusterViewConfig.placements.find((thruster) => thruster.slot === ThrusterSlot.MainBack);
  const topLeftModel = ThrusterModelConfig.find((thruster) => thruster.slot === ThrusterSlot.TopLeft);
  assert.deepEqual(Object.keys(mainModel), ["number", "slot", "size", "acceleration", "energyConsumption"]);
  assert.equal(mainModel.size, 3);
  assert.equal(mainModel.acceleration, 15);
  assert.equal(mainModel.energyConsumption, 3);
  assert.equal(topLeftModel.energyConsumption, 1);
  assert.equal(ThrusterViewConfig.sizeMultiplier, 0.5);
  assert.equal(mainView.localX, -50);
  assert.equal(mainView.directionX, 1);
});

test("scene body configs separate model and view values", () => {
  assert.equal(GravityTestPlanetModelConfig[0].mass, 900);
  assert.equal(GravityTestPlanetModelConfig[0].resources.minerals, 1200);
  assert.equal(GravityTestPlanetViewConfig[0].radius, 48);
  assert.equal(GravityTestPlanetViewConfig[0].x, -280);
  assert.deepEqual(Object.keys(GravityTestShipModelConfig[0]), ["id", "mass", "vx", "vy", "playerControlled"]);
  assert.equal(GravityTestShipModelConfig[1].vx, -4);
  assert.equal(GravityTestShipViewConfig[0].frame.width, 94);
  assert.equal(GravityTestShipViewConfig[1].radius, 50);
});

test("battery, solar panel, and material stress configs expose tuning values", () => {
  assert.equal(BatteryConfig.capacityMapDiagonalRatio, 0.2);
  assert.equal(BatteryConfig.minimumCapacity, 25);
  assert.equal(SolarPanelModelConfig.batteryRechargeRate, 3);
  assert.equal(SolarPanelViewConfig.radius, 8);
  assert.equal(MaterialStressConfig.tolerances.heat, 100);
  assert.equal(MaterialStressConfig.collisionPressurePerDamage, 3);
  assert.equal(MaterialStressConfig.damagePerExcessSecond.acceleration, 0.04);
});

test("simulation and collision config expose tuning values", () => {
  assert.equal(SimulationConfig.fixedDeltaSeconds, 1 / 60);
  assert.equal(SimulationConfig.gravitationalConstant, 36);
  assert.equal(CollisionConfig.damageThreshold, 6);
  assert.equal(CollisionConfig.damageScale, 0.35);
  assert.equal(CollisionConfig.restitution, 0.45);
});

test("gun config separates model and view values", () => {
  assert.equal(GunModelConfig.maxHealth, 25);
  assert.equal(GunModelConfig.range, 480);
  assert.equal(GunModelConfig.energyPerShot, 2);
  assert.equal(GunModelConfig.heatResumeRatio, 0.5);
  assert.equal(GunModelConfig.projectileDamage, 8);
  assert.equal(GunModelConfig.projectileSpeed, 260);
  assert.equal(GunViewConfig.radius, 6);
  assert.equal(GunViewConfig.projectileRadius, 3);
});

test("shield config separates model and view values", () => {
  assert.equal(ShieldModelConfig.maxHealth, 25);
  assert.equal(ShieldModelConfig.maxStrength, 30);
  assert.equal(ShieldModelConfig.rechargeRatePerSecond, 2);
  assert.equal(ShieldModelConfig.energyPerStrength, 1);
  assert.equal(ShieldModelConfig.heatPerAbsorbedDamage, 2);
  assert.equal(ShieldViewConfig.radiusOffset, 10);
});

test("fleet config exposes formation and steering tuning values", () => {
  assert.equal(FleetFormation.Column, "column");
  assert.equal(FleetFormation.Line, "line");
  assert.equal(FleetFormation.Arrow, "arrow");
  assert.equal(FleetFormation.Chevron, "chevron");
  assert.deepEqual(FleetFormationList.map((formation) => formation.id), ["column", "line", "arrow", "chevron"]);
  assert.equal(FleetFormationList[0].label, "COL");
  assert.equal(LabelConfig.fleetFormations.chevron.ariaLabel, "Chevron formation");
  assert.equal(LabelConfig.controls.fleet, "Fleet");
  assert.equal(LabelConfig.controls.fleetFormation, "Fleet formation");
  assert.equal(LabelConfig.maps.FleetTest, "FleetTest");
  assert.equal(FleetModelConfig.spacing, 180);
  assert.equal(FleetModelConfig.arrive.catchUpGain, 0.8);
  assert.equal(FleetModelConfig.arrive.maxCatchUpSpeed, 40);
  assert.equal(FleetModelConfig.separation.radius, 160);
  assert.equal(FleetModelConfig.separation.strength, 120);
  assert.equal(FleetModelConfig.avoid.lookaheadSeconds, 2.5);
  assert.equal(FleetModelConfig.avoid.clearance, 150);
  assert.equal(FleetModelConfig.avoid.strength, 120);
  assert.equal(FleetModelConfig.headingSmoothingRate, 1.5);
  assert.equal(FleetModelConfig.speedErrorForFullThrottle, 25);
  assert.equal(FleetModelConfig.settleSpeedError, 3);
  assert.equal(FleetModelConfig.noseAlignmentSpeedError, 30);
});

test("fleet test scene configs separate model and view values", () => {
  assert.equal(FleetTestShipModelConfig.length, 5);
  assert.equal(FleetTestShipModelConfig[0].playerControlled, "player-one");
  assert.equal(FleetTestShipModelConfig[0].fleetSlot, undefined);
  assert.equal(FleetTestShipModelConfig[1].fleetSlot, 0);
  assert.equal(FleetTestShipModelConfig[4].fleetSlot, 3);
  assert.equal(FleetTestShipViewConfig[0].frame.width, 94);
  assert.equal(FleetTestShipViewConfig[1].x, -140);
  assert.equal(FleetTestPlanetModelConfig[0].mass, 600);
  assert.equal(FleetTestPlanetModelConfig[0].static, true);
  assert.equal(FleetTestPlanetViewConfig[0].radius, 40);
});

test("enemy AI config exposes combat steering tuning values", () => {
  assert.equal(EnemyAiConfig.standoffRangeRatio, 0.7);
  assert.equal(EnemyAiConfig.fallbackRange, 480);
  assert.equal(EnemyAiConfig.approachGain, 0.9);
  assert.equal(EnemyAiConfig.maxApproachSpeed, 70);
  assert.equal(EnemyAiConfig.separation.radius, 160);
  assert.equal(EnemyAiConfig.separation.strength, 120);
  assert.equal(EnemyAiConfig.avoid.lookaheadSeconds, 2.5);
  assert.equal(EnemyAiConfig.avoid.clearance, 150);
  assert.equal(EnemyAiConfig.avoid.strength, 120);
  assert.equal(EnemyAiConfig.speedErrorForFullThrottle, 25);
  assert.equal(EnemyAiConfig.settleSpeedError, 3);
  assert.equal(EnemyAiConfig.noseAlignmentSpeedError, 30);
});

test("fleet battle scene configs separate model and view values", () => {
  assert.equal(LabelConfig.maps.FleetBattle, "FleetBattle");
  assert.equal(FleetBattleShipModelConfig.length, 8);
  assert.equal(FleetBattleShipModelConfig[0].playerControlled, "player-one");
  assert.equal(FleetBattleShipModelConfig[0].faction, "player");
  assert.equal(FleetBattleShipModelConfig[1].fleetSlot, 0);
  assert.equal(FleetBattleShipModelConfig[5].faction, "hostile");
  assert.equal(FleetBattleShipModelConfig[5].rotation, Math.PI / 2);
  assert.equal(FleetBattleShipViewConfig[0].y, 420);
  assert.equal(FleetBattleShipViewConfig[5].y, -480);
  assert.equal(FleetBattlePlanetModelConfig[0].mass, 550);
  assert.equal(FleetBattlePlanetViewConfig[0].x, -520);
});

test("space map config separates model and view values", () => {
  assert.equal(LabelConfig.maps.SpaceMap, "SpaceMap");
  assert.equal(LabelConfig.spaceMap.title, "Space Map");
  assert.equal(LabelConfig.spaceMap.regionPrefix, "R");
  assert.equal(SpaceMapModelConfig.seed, 1337);
  assert.equal(SpaceMapModelConfig.regionCount, 18);
  assert.equal(SpaceMapModelConfig.relaxationIterations, 2);
  assert.equal(SpaceMapModelConfig.siteMargin, 40);
  assert.deepEqual(SpaceMapModelConfig.bounds, { minX: -640, minY: -400, maxX: 640, maxY: 400 });
  assert.equal(SpaceMapViewConfig.padding, 60);
  assert.equal(SpaceMapViewConfig.siteRadius, 5);
  assert.equal(SpaceMapViewConfig.regionPalette.length > 0, true);
  assert.equal(SpaceMapViewConfig.starCount, 90);
  assert.equal(SpaceMapViewConfig.conqueredFillColor, "#86efac");
  assert.equal(SpaceMapViewConfig.conqueredFillAlpha, 0.32);
  assert.equal(LabelConfig.spaceMap.conqueredSuffix, " ✓");
  assert.equal(LabelConfig.battleWon.title, "Sector Conquered");
  assert.equal(LabelConfig.battleWon.returnToMap, "Return to Map");
  assert.equal(LabelConfig.gameWon.title, "Galaxy Conquered");
  assert.equal(LabelConfig.gameWon.newCampaign, "New Campaign");
});

test("battle config exposes procedural generation ranges", () => {
  assert.equal(LabelConfig.maps.Battle, "Battle");
  assert.deepEqual(BattleModelConfig.planetCount, { min: 1, max: 3 });
  assert.deepEqual(BattleModelConfig.planetMass, { min: 350, max: 750 });
  assert.deepEqual(BattleModelConfig.planetArea, { minX: -520, minY: -240, maxX: 520, maxY: 240 });
  assert.equal(BattleModelConfig.planetSpacing, 240);
  assert.equal(BattleModelConfig.planetPlacementAttempts, 20);
  assert.equal(BattleModelConfig.resourcePlanetChance, 0.25);
  assert.deepEqual(BattleModelConfig.resourceMinerals, { min: 600, max: 1400 });
  assert.deepEqual(BattleModelConfig.enemyCount, { min: 3, max: 6 });
  assert.deepEqual(BattleModelConfig.enemyAnchor, { minX: -280, maxX: 280, minY: -560, maxY: -440 });
  assert.equal(BattleModelConfig.enemyFacing, Math.PI / 2);
  assert.equal(BattleModelConfig.arenaMargin, 400);
  assert.deepEqual(BattleViewConfig.planetRadius, { min: 30, max: 52 });
  assert.equal(BattleViewConfig.enemyShipRadius, 50);
  assert.equal(BattleViewConfig.arena.borderWidth, 2);
});

test("flight control config exposes stabilization tuning values", () => {
  assert.equal(FlightControlConfig.stop.fullPowerSpeed, 45);
  assert.equal(FlightControlConfig.stop.alignmentThreshold, 0.35);
  assert.equal(FlightControlConfig.turn.angleErrorGain, 1.45);
  assert.equal(FlightControlConfig.turn.angularVelocityGain, 0.8);
  assert.equal(FlightControlConfig.turn.dampingGain, 0.8);
  assert.equal(FlightControlConfig.minMainThrusterPower, 0.02);
  assert.equal(FlightControlConfig.batteryThrustShare, 0.5);
});
