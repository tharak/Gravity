import assert from "node:assert/strict";
import test from "node:test";
import { CollisionConfig } from "../src/config/collisionConfig.js";
import { LabelConfig } from "../src/config/labelConfig.js";
import { DefaultShipConfig, StarterShipConfig, ThrusterLayoutConfig } from "../src/config/shipConfig.js";
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

test("ship config contains defaults and thruster layout tuning", () => {
  assert.equal(DefaultShipConfig.maxHealth, 100);
  assert.equal(DefaultShipConfig.batteryCapacity, 100);
  assert.equal(DefaultShipConfig.maxThrusterSpeed, 120);
  assert.equal(StarterShipConfig.thrusterAcceleration, 15);

  const main = ThrusterLayoutConfig.find((thruster) => thruster.slot === ThrusterSlot.MainBack);
  const topLeft = ThrusterLayoutConfig.find((thruster) => thruster.slot === ThrusterSlot.TopLeft);
  assert.equal(main.accelerationMultiplier, 10);
  assert.equal(main.energyUsePerSecond, 3);
  assert.equal(topLeft.energyUsePerSecond, 1);
});

test("simulation and collision config expose tuning values", () => {
  assert.equal(SimulationConfig.fixedDeltaSeconds, 1 / 60);
  assert.equal(SimulationConfig.gravitationalConstant, 36);
  assert.equal(CollisionConfig.damageThreshold, 6);
  assert.equal(CollisionConfig.damageScale, 0.35);
  assert.equal(CollisionConfig.restitution, 0.45);
});
