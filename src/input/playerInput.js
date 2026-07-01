import { thrusterColors } from "../game/thrusterPalette.js";

export const ControllerMode = Object.freeze({
  Automatic: "automatic",
  Manual: "manual"
});

export const SpeedOrder = Object.freeze({
  OneThird: "one-third",
  TwoThirds: "two-thirds",
  Standard: "standard",
  Full: "full",
  Flank: "flank"
});

export const SpeedOrders = Object.freeze([
  Object.freeze({ id: SpeedOrder.OneThird, label: "1/3", speedLevel: 1 / 3 }),
  Object.freeze({ id: SpeedOrder.TwoThirds, label: "2/3", speedLevel: 2 / 3 }),
  Object.freeze({ id: SpeedOrder.Standard, label: "STD", speedLevel: 0.82 }),
  Object.freeze({ id: SpeedOrder.Full, label: "FULL", speedLevel: 1 }),
  Object.freeze({ id: SpeedOrder.Flank, label: "FLANK", speedLevel: 1.25 })
]);

const speedLevelByOrder = new Map(SpeedOrders.map((order) => [order.id, order.speedLevel]));

export function createPlayerInput() {
  return {
    controllerMode: ControllerMode.Manual,
    activeSlots: new Set(),
    speedOrder: SpeedOrder.Standard,
    speedLevel: getSpeedLevel(SpeedOrder.Standard)
  };
}

export function bindThrusterControls(root, input) {
  for (const button of root.querySelectorAll("[data-thruster-slot]")) {
    const color = thrusterColors[button.dataset.thrusterSlot];
    if (color) {
      button.style.setProperty("--thruster-color", color);
    }

    button.addEventListener("click", () => {
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

  syncSpeedButtons(root, input.speedOrder);
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
    input.activeSlots.add(slot);
    return;
  }

  input.activeSlots.delete(slot);
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
  input.controllerMode = ControllerMode.Manual;
  input.activeSlots.clear();
  setSpeedOrder(input, SpeedOrder.Standard);
}

function syncSpeedButtons(root, activeOrder) {
  for (const button of root.querySelectorAll("[data-speed-order]")) {
    const isActive = button.dataset.speedOrder === activeOrder;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function getSpeedLevel(speedOrder) {
  return speedLevelByOrder.get(speedOrder) ?? speedLevelByOrder.get(SpeedOrder.Standard);
}

function clampSpeed(value) {
  return Math.max(0, Math.min(1.25, Number.isFinite(value) ? value : 0));
}
