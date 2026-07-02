import assert from "node:assert/strict";
import test from "node:test";
import { CollisionConfig } from "../src/config/collisionConfig.js";
import { LabelConfig } from "../src/config/labelConfig.js";
import { DefaultShipModelConfig, DefaultShipViewConfig, GravityTestShipModelConfig, GravityTestShipViewConfig, StarterShipModelConfig, StarterShipViewConfig, ThrusterModelConfig, ThrusterViewConfig } from "../src/config/shipConfig.js";
import { GravityTestPlanetModelConfig, GravityTestPlanetViewConfig } from "../src/config/planetConfig.js";
import { SimulationConfig } from "../src/config/simulationConfig.js";
import { SpeedOrderConfig, SpeedOrderList } from "../src/config/speedOrderConfig.js";
import { ThrusterSlot } from "../src/ecs/components.js";
import { SpeedOrder, SpeedOrders } from "../src/input/playerInput.js";

test("label config centralizes visible UI text", () => {
  assert.equal(LabelConfig.appTitle, "Gravity");
  assert.equal(LabelConfig.levelSelectTitle, "Choose Test Map");
  assert.equal(LabelConfig.readouts.worldNorthCanvas, "WORLD N");
  assert.equal(LabelConfig.speedOrders.Flank.label, "FLANK");
  assert.equal(LabelConfig.controls.locked, "LOCKED");
  assert.equal(LabelConfig.controllerModes.manualShort, "MAN");
  assert.equal(LabelConfig.directions.NorthEast.ariaLabel, "North east");
});

test("speed order config is the source for exported speed orders", () => {
  assert.equal(SpeedOrder.Full, SpeedOrderConfig.Full.id);
  assert.equal(SpeedOrder.Flank, SpeedOrderConfig.Flank.id);
  assert.equal(SpeedOrderConfig.Full.powerConsumptionWeight, 1.25);
  assert.equal(SpeedOrderConfig.Flank.powerConsumptionWeight, 1.5);
  assert.deepEqual(SpeedOrders, SpeedOrderList);
});

test("ship and thruster configs separate model and view values", () => {
  assert.equal(DefaultShipModelConfig.maxHealth, 100);
  assert.equal(DefaultShipModelConfig.batteryCapacity, 100);
  assert.equal(DefaultShipModelConfig.maxThrusterSpeed, 120);
  assert.equal(DefaultShipViewConfig.radius, 48);
  assert.equal(DefaultShipViewConfig.frame.width, 88);
  assert.equal(StarterShipModelConfig.thrusterAcceleration, 15);
  assert.equal(StarterShipViewConfig.frame.width, 94);

  const mainModel = ThrusterModelConfig.find((thruster) => thruster.slot === ThrusterSlot.MainBack);
  const mainView = ThrusterViewConfig.placements.find((thruster) => thruster.slot === ThrusterSlot.MainBack);
  const topLeftModel = ThrusterModelConfig.find((thruster) => thruster.slot === ThrusterSlot.TopLeft);
  assert.deepEqual(Object.keys(mainModel), ["number", "slot", "size", "energyConsumption"]);
  assert.equal(mainModel.size, 3);
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
  assert.equal(GravityTestShipModelConfig[0].thrusterAcceleration, 15);
  assert.equal(GravityTestShipModelConfig[1].vx, -4);
  assert.equal(GravityTestShipViewConfig[0].frame.width, 94);
  assert.equal(GravityTestShipViewConfig[1].radius, 50);
});

test("simulation and collision config expose tuning values", () => {
  assert.equal(SimulationConfig.fixedDeltaSeconds, 1 / 60);
  assert.equal(SimulationConfig.gravitationalConstant, 36);
  assert.equal(CollisionConfig.damageThreshold, 6);
  assert.equal(CollisionConfig.damageScale, 0.35);
  assert.equal(CollisionConfig.restitution, 0.45);
});
