import { thrusterColors } from "../game/thrusterPalette.js";
export function createPlayerInput() {
  return {
    activeSlots: new Set(),
    powerLevel: 1
  };
}

export function bindThrusterControls(root, input) {
  const powerSlider = root.querySelector("#thruster-power");

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

  if (powerSlider) {
    setPowerLevel(input, Number(powerSlider.value) / 100);
    powerSlider.addEventListener("input", () => {
      setPowerLevel(input, Number(powerSlider.value) / 100);
    });
  }
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

export function setPowerLevel(input, powerLevel) {
  input.powerLevel = clamp01(powerLevel);
}

export function clearPlayerInput(input) {
  input.activeSlots.clear();
  input.powerLevel = 1;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
