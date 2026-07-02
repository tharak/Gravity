import { LabelConfig } from "../config/labelConfig.js";
import { SpeedOrderConfig, SpeedOrderList } from "../config/speedOrderConfig.js";
import { WORLD_NORTH_ANGLE } from "../game/navigation.js";
import { ThrusterSlot } from "../ecs/components.js";
import { thrusterColors } from "../game/thrusterPalette.js";

export const ControllerMode = Object.freeze({
  Automatic: "automatic",
  Manual: "manual"
});

export const SpeedOrder = Object.freeze(Object.fromEntries(
  Object.entries(SpeedOrderConfig).map(([name, config]) => [name, config.id])
));

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

export const ThrusterKeyBindings = Object.freeze({
  KeyA: Object.freeze([ThrusterSlot.TopLeft, ThrusterSlot.BottomRight]),
  KeyD: Object.freeze([ThrusterSlot.TopRight, ThrusterSlot.BottomLeft]),
  KeyW: Object.freeze([ThrusterSlot.MainBack]),
  KeyS: Object.freeze([ThrusterSlot.FrontLeft, ThrusterSlot.FrontRight])
});

export const SpeedOrders = SpeedOrderList;

export const DirectionOrders = Object.freeze([
  Object.freeze({ id: DirectionOrder.North, ...LabelConfig.directions.North, angle: WORLD_NORTH_ANGLE }),
  Object.freeze({ id: DirectionOrder.NorthEast, ...LabelConfig.directions.NorthEast, angle: WORLD_NORTH_ANGLE + Math.PI / 4 }),
  Object.freeze({ id: DirectionOrder.East, ...LabelConfig.directions.East, angle: WORLD_NORTH_ANGLE + Math.PI / 2 }),
  Object.freeze({ id: DirectionOrder.SouthEast, ...LabelConfig.directions.SouthEast, angle: WORLD_NORTH_ANGLE + 3 * Math.PI / 4 }),
  Object.freeze({ id: DirectionOrder.South, ...LabelConfig.directions.South, angle: WORLD_NORTH_ANGLE + Math.PI }),
  Object.freeze({ id: DirectionOrder.SouthWest, ...LabelConfig.directions.SouthWest, angle: WORLD_NORTH_ANGLE - 3 * Math.PI / 4 }),
  Object.freeze({ id: DirectionOrder.West, ...LabelConfig.directions.West, angle: WORLD_NORTH_ANGLE - Math.PI / 2 }),
  Object.freeze({ id: DirectionOrder.NorthWest, ...LabelConfig.directions.NorthWest, angle: WORLD_NORTH_ANGLE - Math.PI / 4 })
]);

const speedLevelByOrder = new Map(SpeedOrders.map((order) => [order.id, order.speedLevel]));
const powerConsumptionWeightByOrder = new Map(SpeedOrders.map((order) => [order.id, order.powerConsumptionWeight]));
const speedOrderIndexById = new Map(SpeedOrders.map((order, index) => [order.id, index]));
const angleByDirection = new Map(DirectionOrders.map((direction) => [direction.id, direction.angle]));
const maxConfiguredSpeedLevel = Math.max(...SpeedOrders.map((order) => order.speedLevel));

export function createPlayerInput() {
  return {
    controllerMode: ControllerMode.Manual,
    activeSlots: new Set(),
    activeAccelerationKeys: new Set(),
    speedOrder: SpeedOrder.Stop,
    speedLevel: getSpeedLevel(SpeedOrder.Stop),
    powerConsumptionWeight: getPowerConsumptionWeight(SpeedOrder.Stop),
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

  for (const button of root.querySelectorAll("[data-acceleration-step]")) {
    button.addEventListener("click", () => {
      changeAccelerationOrder(input, Number(button.dataset.accelerationStep));
      syncSpeedButtons(root, input.speedOrder);
    });
  }

  for (const button of root.querySelectorAll("[data-key-code]")) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      setKeyboardThrusters(input, button.dataset.keyCode, true);
      syncPlayerInputControls(root, input);
    });

    for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
      button.addEventListener(eventName, (event) => {
        event.preventDefault();
        setKeyboardThrusters(input, button.dataset.keyCode, false);
        syncPlayerInputControls(root, input);
      });
    }
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
  syncKeyboardButtons(root, input.activeSlots);
  syncAccelerationButtons(root, input.activeAccelerationKeys);
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

export function setKeyboardThrusters(input, code, enabled) {
  const slots = ThrusterKeyBindings[code];
  if (!slots) {
    return false;
  }

  for (const slot of slots) {
    setThrusterEnabled(input, slot, enabled);
  }
  return true;
}

export function setKeyboardAcceleration(input, code, enabled = true) {
  if (code === "KeyQ") {
    setAccelerationKeyActive(input, code, enabled);
    if (enabled) {
      changeAccelerationOrder(input, -1);
    }
    return true;
  }

  if (code === "KeyE") {
    setAccelerationKeyActive(input, code, enabled);
    if (enabled) {
      changeAccelerationOrder(input, 1);
    }
    return true;
  }

  return false;
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
  input.powerConsumptionWeight = getPowerConsumptionWeight(input.speedOrder);
}

export function setSpeedLevel(input, speedLevel) {
  input.speedOrder = undefined;
  input.speedLevel = clampSpeed(speedLevel);
  input.powerConsumptionWeight = 1;
}

export function changeAccelerationOrder(input, step) {
  const currentIndex = speedOrderIndexById.get(input.speedOrder) ?? speedOrderIndexById.get(SpeedOrder.Stop);
  const nextIndex = Math.max(0, Math.min(SpeedOrders.length - 1, currentIndex + Math.sign(step || 0)));
  setSpeedOrder(input, SpeedOrders[nextIndex].id);
}

export function clearPlayerInput(input) {
  setControllerMode(input, ControllerMode.Manual);
  input.activeSlots.clear();
  input.activeAccelerationKeys.clear();
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

function syncKeyboardButtons(root, activeSlots) {
  for (const button of root.querySelectorAll("[data-key-code]")) {
    const slots = ThrusterKeyBindings[button.dataset.keyCode] ?? [];
    const isActive = slots.length > 0 && slots.every((slot) => activeSlots.has(slot));
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function syncAccelerationButtons(root, activeKeys) {
  for (const button of root.querySelectorAll("[data-acceleration-key]")) {
    const isActive = activeKeys.has(button.dataset.accelerationKey);
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

function setAccelerationKeyActive(input, code, enabled) {
  if (enabled) {
    input.activeAccelerationKeys.add(code);
    return;
  }

  input.activeAccelerationKeys.delete(code);
}

function getSpeedLevel(speedOrder) {
  return speedLevelByOrder.get(speedOrder) ?? speedLevelByOrder.get(SpeedOrder.Standard);
}

function getPowerConsumptionWeight(speedOrder) {
  return powerConsumptionWeightByOrder.get(speedOrder) ?? powerConsumptionWeightByOrder.get(SpeedOrder.Standard);
}

function getDirectionAngle(directionOrder) {
  return angleByDirection.get(directionOrder) ?? angleByDirection.get(DirectionOrder.North);
}

function clampSpeed(value) {
  return Math.max(0, Math.min(maxConfiguredSpeedLevel, Number.isFinite(value) ? value : 0));
}
