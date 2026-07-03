import { FactionId, ThrusterSlot } from "../ecs/components.js";

export const DefaultShipModelConfig = Object.freeze({
  mass: 2,
  maxHealth: 100,
  batteryRechargeRate: 1
});

export const DefaultShipViewConfig = Object.freeze({
  radius: 48,
  frame: Object.freeze({ width: 88, height: 42 })
});

export const StarterShipModelConfig = Object.freeze({
  mass: 2,
  playerControlled: "player-one"
});

export const StarterShipViewConfig = Object.freeze({
  radius: 56,
  frame: Object.freeze({ width: 94, height: 46 })
});

export const ThrusterModelConfig = Object.freeze([
  Object.freeze({ number: 1, slot: ThrusterSlot.MainBack, size: 3, acceleration: 15, energyConsumption: 3 }),
  Object.freeze({ number: 2, slot: ThrusterSlot.FrontLeft, size: 1, acceleration: 15, energyConsumption: 1 }),
  Object.freeze({ number: 3, slot: ThrusterSlot.FrontRight, size: 1, acceleration: 15, energyConsumption: 1 }),
  Object.freeze({ number: 4, slot: ThrusterSlot.TopLeft, size: 1, acceleration: 15, energyConsumption: 1 }),
  Object.freeze({ number: 5, slot: ThrusterSlot.TopRight, size: 1, acceleration: 15, energyConsumption: 1 }),
  Object.freeze({ number: 6, slot: ThrusterSlot.BottomLeft, size: 1, acceleration: 15, energyConsumption: 1 }),
  Object.freeze({ number: 7, slot: ThrusterSlot.BottomRight, size: 1, acceleration: 15, energyConsumption: 1 })
]);

export const ThrusterViewConfig = Object.freeze({
  sizeMultiplier: 0.5,
  placements: Object.freeze([
    Object.freeze({ slot: ThrusterSlot.MainBack, localX: -50, localY: 0, directionX: 1, directionY: 0 }),
    Object.freeze({ slot: ThrusterSlot.FrontLeft, localX: 50, localY: -12, directionX: -1, directionY: 0 }),
    Object.freeze({ slot: ThrusterSlot.FrontRight, localX: 50, localY: 12, directionX: -1, directionY: 0 }),
    Object.freeze({ slot: ThrusterSlot.TopLeft, localX: -24, localY: -26, directionX: 0, directionY: 1 }),
    Object.freeze({ slot: ThrusterSlot.TopRight, localX: 24, localY: -26, directionX: 0, directionY: 1 }),
    Object.freeze({ slot: ThrusterSlot.BottomLeft, localX: -24, localY: 26, directionX: 0, directionY: -1 }),
    Object.freeze({ slot: ThrusterSlot.BottomRight, localX: 24, localY: 26, directionX: 0, directionY: -1 })
  ])
});

export const GravityTestShipModelConfig = Object.freeze([
  Object.freeze({ id: "player", mass: 2, vx: 0, vy: 0, playerControlled: "player-one" }),
  Object.freeze({ id: "drifter-east", mass: 2, vx: -4, vy: 2, rotation: -0.35 }),
  Object.freeze({ id: "drifter-southwest", mass: 2, vx: 3, vy: -2, rotation: 0.65 })
]);

export const GravityTestShipViewConfig = Object.freeze([
  Object.freeze({ id: "player", x: -80, y: 35, radius: 52, frame: Object.freeze({ width: 94, height: 46 }) }),
  Object.freeze({ id: "drifter-east", x: 130, y: 40, radius: 50 }),
  Object.freeze({ id: "drifter-southwest", x: -180, y: 150, radius: 50 })
]);

export const FleetTestShipModelConfig = Object.freeze([
  Object.freeze({ id: "flagship", mass: 2, vx: 0, vy: 0, playerControlled: "player-one" }),
  Object.freeze({ id: "escort-one", mass: 2, vx: 0, vy: 0, fleetSlot: 0 }),
  Object.freeze({ id: "escort-two", mass: 2, vx: 0, vy: 0, fleetSlot: 1 }),
  Object.freeze({ id: "escort-three", mass: 2, vx: 0, vy: 0, fleetSlot: 2 }),
  Object.freeze({ id: "escort-four", mass: 2, vx: 0, vy: 0, fleetSlot: 3 })
]);

export const FleetTestShipViewConfig = Object.freeze([
  Object.freeze({ id: "flagship", x: 0, y: 0, radius: 52, frame: Object.freeze({ width: 94, height: 46 }) }),
  Object.freeze({ id: "escort-one", x: -140, y: 170, radius: 50 }),
  Object.freeze({ id: "escort-two", x: 140, y: 170, radius: 50 }),
  Object.freeze({ id: "escort-three", x: -170, y: 330, radius: 50 }),
  Object.freeze({ id: "escort-four", x: 170, y: 330, radius: 50 })
]);

export const FleetBattleShipModelConfig = Object.freeze([
  Object.freeze({ id: "flagship", mass: 2, vx: 0, vy: 0, playerControlled: "player-one", faction: FactionId.Player }),
  Object.freeze({ id: "escort-one", mass: 2, vx: 0, vy: 0, faction: FactionId.Player, fleetSlot: 0 }),
  Object.freeze({ id: "escort-two", mass: 2, vx: 0, vy: 0, faction: FactionId.Player, fleetSlot: 1 }),
  Object.freeze({ id: "escort-three", mass: 2, vx: 0, vy: 0, faction: FactionId.Player, fleetSlot: 2 }),
  Object.freeze({ id: "escort-four", mass: 2, vx: 0, vy: 0, faction: FactionId.Player, fleetSlot: 3 }),
  Object.freeze({ id: "raider-one", mass: 2, vx: 0, vy: 0, faction: FactionId.Hostile, rotation: Math.PI / 2 }),
  Object.freeze({ id: "raider-two", mass: 2, vx: 0, vy: 0, faction: FactionId.Hostile, rotation: Math.PI / 2 }),
  Object.freeze({ id: "raider-three", mass: 2, vx: 0, vy: 0, faction: FactionId.Hostile, rotation: Math.PI / 2 })
]);

export const FleetBattleShipViewConfig = Object.freeze([
  Object.freeze({ id: "flagship", x: 0, y: 420, radius: 52, frame: Object.freeze({ width: 94, height: 46 }) }),
  Object.freeze({ id: "escort-one", x: -140, y: 590, radius: 50 }),
  Object.freeze({ id: "escort-two", x: 140, y: 590, radius: 50 }),
  Object.freeze({ id: "escort-three", x: -170, y: 750, radius: 50 }),
  Object.freeze({ id: "escort-four", x: 170, y: 750, radius: 50 }),
  Object.freeze({ id: "raider-one", x: -260, y: -480, radius: 50 }),
  Object.freeze({ id: "raider-two", x: 0, y: -560, radius: 50 }),
  Object.freeze({ id: "raider-three", x: 260, y: -480, radius: 50 })
]);
