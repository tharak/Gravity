import { ThrusterSlot } from "../ecs/components.js";

export const DefaultShipConfig = Object.freeze({
  mass: 2,
  radius: 48,
  frame: Object.freeze({ width: 88, height: 42 }),
  maxHealth: 100,
  batteryCapacity: 100,
  batteryRechargeRate: 1,
  thrusterAcceleration: 13,
  maxThrusterSpeed: 120
});

export const StarterShipConfig = Object.freeze({
  mass: 2,
  radius: 56,
  playerControlled: "player-one",
  thrusterAcceleration: 15,
  frame: Object.freeze({ width: 94, height: 46 })
});

export const ThrusterLayoutConfig = Object.freeze([
  Object.freeze({ number: 1, slot: ThrusterSlot.MainBack, localX: -50, localY: 0, directionX: 1, directionY: 0, accelerationMultiplier: 10, energyUsePerSecond: 3 }),
  Object.freeze({ number: 2, slot: ThrusterSlot.FrontLeft, localX: 42, localY: -12, directionX: -1, directionY: 0, accelerationMultiplier: 1, energyUsePerSecond: 1 }),
  Object.freeze({ number: 3, slot: ThrusterSlot.FrontRight, localX: 42, localY: 12, directionX: -1, directionY: 0, accelerationMultiplier: 1, energyUsePerSecond: 1 }),
  Object.freeze({ number: 4, slot: ThrusterSlot.TopLeft, localX: -24, localY: -26, directionX: 0, directionY: 1, accelerationMultiplier: 1, energyUsePerSecond: 1 }),
  Object.freeze({ number: 5, slot: ThrusterSlot.TopRight, localX: 24, localY: -26, directionX: 0, directionY: 1, accelerationMultiplier: 1, energyUsePerSecond: 1 }),
  Object.freeze({ number: 6, slot: ThrusterSlot.BottomLeft, localX: -24, localY: 26, directionX: 0, directionY: -1, accelerationMultiplier: 1, energyUsePerSecond: 1 }),
  Object.freeze({ number: 7, slot: ThrusterSlot.BottomRight, localX: 24, localY: 26, directionX: 0, directionY: -1, accelerationMultiplier: 1, energyUsePerSecond: 1 })
]);
