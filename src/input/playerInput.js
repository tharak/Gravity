import { WORLD_NORTH_ANGLE } from "../game/navigation.js";
import { thrusterColors } from "../game/thrusterPalette.js";

export const ControllerMode = Object.freeze({
  Automatic: "automatic",
  Manual: "manual"
});

export const SpeedOrder = Object.freeze({
  Stop: "stop",
  OneThird: "one-third",
  TwoThirds: "two-thirds",
  Standard: "standard",
  Full: "full",
  Flank: "flank"
});

export const DirectionOrder = Object.freeze({
  North: "north",
  NorthEast: "north-east",
  East: "east",
  SouthEast: "south-east",
  South: "south",
  SouthWest: "south-west",
  West: "west",
  NorthWest: "north-west"
});

export const SpeedOrders = Object.freeze([
  Object.freeze({ id: SpeedOrder.Stop, label: "STOP", speedLevel: 0 }),
  Object.freeze({ id: SpeedOrder.OneThird, label: "1/3", speedLevel: 1 / 3 }),
  Object.freeze({ id: SpeedOrder.TwoThirds, label: "2/3", speedLevel: 2 / 3 }),
  Object.freeze({ id: SpeedOrder.Standard, label: "STD", speedLevel: 0.82 }),
  Object.freeze({ id: SpeedOrder.Full, label: "FULL", speedLevel: 1 }),
  Object.freeze({ id: SpeedOrder.Flank, label: "FLANK", speedLevel: 1.25 })
]);

export const DirectionOrders = Object.freeze([
  Object.freeze({ id: DirectionOrder.North, label: "N", angle: WORLD_NORTH_ANGLE }),
  Object.freeze({ id: DirectionOrder.NorthEast, label: "NE", angle: WORLD_NORTH_ANGLE + Math.PI / 4 }),
  Object.freeze({ id: DirectionOrder.East, label: "E", angle: WORLD_NORTH_ANGLE + Math.PI / 2 }),
  Object.freeze({ id: DirectionOrder.SouthEast, label: "SE", angle: WORLD_NORTH_ANGLE + 3 * Math.PI / 4 }),
  Object.freeze({ id: DirectionOrder.South, label: "S", angle: WORLD_NORTH_ANGLE + Math.PI }),
  Object.freeze({ id: DirectionOrder.SouthWest, label: "SW", angle: WORLD_NORTH_ANGLE - 3 * Math.PI / 4 }),
  Object.freeze({ id: DirectionOrder.West, label: "W", angle: WORLD_NORTH_ANGLE - Math.PI / 2 }),
  Object.freeze({ id: DirectionOrder.NorthWest, label: "NW", angle: WORLD_NORTH_ANGLE - Math.PI / 4 })
]);

const speedLevelByOrder = new Map(SpeedOrders.map((order) => [order.id, order.speedLevel]));
const angleByDirection = new Map(DirectionOrders.map((direction) => [direction.id, direction.angle]));

export function createPlayerInput() {
  return {
    controllerMode: ControllerMode.Manual,
    activeSlots: new Set(),
    speedOrder: SpeedOrder.Stop,
    speedLevel: getSpeedLevel(SpeedOrder.Stop),
    targetDirection: DirectionOrder.North,
    targetAngle: getDirectionAngle(DirectionOrder.North)
  };
}

export function bindThrusterControls(root, input) {
  for (const button of root.querySelectorAll("[data-thruster-slot]")) {
    const color = thrusterColors[button.dataset.thrusterSlot];
    if (color) {
      button.style.setProperty("--thruster-color", color);
    }

    button.addEventListener("click", () => {
      setControllerMode(input, ControllerMode.Manual);
      syncModePanels(root, input.controllerMode);
      toggleThruster(input, button.dataset.thrusterSlot);
      button.classList.toggle("is-active", input.activeSlots.has(button.dataset.thrusterSlot));
      button.setAttribute("aria-pressed", String(input.activeSlots.has(button.dataset.thrusterSlot)));
    });
  }

  for (const button of root.querySelectorAll("[data-speed-order]")) {
    button.addEventListener("click", () => {
      setSpeedOrder(input, button.dataset.speedOrder);
      syncSpeedButtons(root, input.speedOrder);
    });
  }

  for (const button of root.querySelectorAll("[data-controller-mode]")) {
    button.addEventListener("click", () => {
      setControllerMode(input, button.dataset.controllerMode);
      syncModePanels(root, input.controllerMode);
      syncThrusterButtons(root, input.activeSlots);
    });
  }

  for (const button of root.querySelectorAll("[data-direction-order]")) {
    button.addEventListener("click", () => {
      setAutomaticDirection(input, button.dataset.directionOrder);
      syncModePanels(root, input.controllerMode);
      syncThrusterButtons(root, input.activeSlots);
      syncDirectionButtons(root, input.targetDirection);
    });
  }

  syncPlayerInputControls(root, input);
}

export function syncPlayerInputControls(root, input) {
  syncSpeedButtons(root, input.speedOrder);
  syncModePanels(root, input.controllerMode);
  syncThrusterButtons(root, input.activeSlots);
  syncDirectionButtons(root, input.targetDirection);
}

export function toggleThruster(input, slot) {
  if (input.activeSlots.has(slot)) {
    input.activeSlots.delete(slot);
    return;
  }

  input.activeSlots.add(slot);
}

export function setThrusterEnabled(input, slot, enabled) {
  if (enabled) {
    setControllerMode(input, ControllerMode.Manual);
    input.activeSlots.add(slot);
    return;
  }

  input.activeSlots.delete(slot);
}

export function setControllerMode(input, controllerMode) {
  input.controllerMode = controllerMode === ControllerMode.Automatic ? ControllerMode.Automatic : ControllerMode.Manual;
  if (input.controllerMode === ControllerMode.Automatic) {
    input.activeSlots.clear();
  }
}

export function setAutomaticDirection(input, directionOrder) {
  setControllerMode(input, ControllerMode.Automatic);
  input.targetDirection = angleByDirection.has(directionOrder) ? directionOrder : DirectionOrder.North;
  input.targetAngle = getDirectionAngle(input.targetDirection);
}

export function setSpeedOrder(input, speedOrder) {
  input.speedOrder = speedLevelByOrder.has(speedOrder) ? speedOrder : SpeedOrder.Standard;
  input.speedLevel = getSpeedLevel(input.speedOrder);
}

export function setSpeedLevel(input, speedLevel) {
  input.speedOrder = undefined;
  input.speedLevel = clampSpeed(speedLevel);
}

export function clearPlayerInput(input) {
  setControllerMode(input, ControllerMode.Manual);
  input.activeSlots.clear();
  setSpeedOrder(input, SpeedOrder.Stop);
  setAutomaticDirection(input, DirectionOrder.North);
  setControllerMode(input, ControllerMode.Manual);
}

function syncSpeedButtons(root, activeOrder) {
  for (const button of root.querySelectorAll("[data-speed-order]")) {
    const isActive = button.dataset.speedOrder === activeOrder;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function syncThrusterButtons(root, activeSlots) {
  for (const button of root.querySelectorAll("[data-thruster-slot]")) {
    const isActive = activeSlots.has(button.dataset.thrusterSlot);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function syncModePanels(root, activeMode) {
  for (const button of root.querySelectorAll("[data-controller-mode]")) {
    const isActive = button.dataset.controllerMode === activeMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  for (const panel of root.querySelectorAll("[data-controller-panel]")) {
    const isDisabled = panel.dataset.controllerPanel !== activeMode;
    panel.classList.toggle("is-disabled", isDisabled);
    panel.setAttribute("aria-disabled", String(isDisabled));
  }
}

function syncDirectionButtons(root, activeDirection) {
  for (const button of root.querySelectorAll("[data-direction-order]")) {
    const isActive = button.dataset.directionOrder === activeDirection;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function getSpeedLevel(speedOrder) {
  return speedLevelByOrder.get(speedOrder) ?? speedLevelByOrder.get(SpeedOrder.Standard);
}

function getDirectionAngle(directionOrder) {
  return angleByDirection.get(directionOrder) ?? angleByDirection.get(DirectionOrder.North);
}

function clampSpeed(value) {
  return Math.max(0, Math.min(1.25, Number.isFinite(value) ? value : 0));
}
