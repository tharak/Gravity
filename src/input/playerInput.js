export function createPlayerInput() {
  return {
    active: false,
    x: 0,
    y: 0,
    strength: 0
  };
}

export function bindThrusterButtons(root, input) {
  const activePointers = new Map();

  for (const button of root.querySelectorAll("[data-thrust-x][data-thrust-y]")) {
    button.addEventListener("pointerdown", (pointerEvent) => {
      pointerEvent.preventDefault();
      button.setPointerCapture(pointerEvent.pointerId);
      button.classList.add("is-active");
      activePointers.set(pointerEvent.pointerId, getButtonInput(button));
      applyLatestPointer(input, activePointers);
    });

    button.addEventListener("pointerup", (pointerEvent) => {
      releasePointer(button, input, activePointers, pointerEvent.pointerId);
    });

    button.addEventListener("pointercancel", (pointerEvent) => {
      releasePointer(button, input, activePointers, pointerEvent.pointerId);
    });

    button.addEventListener("lostpointercapture", (pointerEvent) => {
      releasePointer(button, input, activePointers, pointerEvent.pointerId);
    });
  }
}

export function setDirectionalInput(input, direction) {
  input.active = true;
  input.x = direction.x;
  input.y = direction.y;
  input.strength = 1;
}

export function clearPlayerInput(input) {
  input.active = false;
  input.x = 0;
  input.y = 0;
  input.strength = 0;
}

function releasePointer(button, input, activePointers, pointerId) {
  button.classList.remove("is-active");
  activePointers.delete(pointerId);
  applyLatestPointer(input, activePointers);
}

function applyLatestPointer(input, activePointers) {
  const latest = [...activePointers.values()].at(-1);
  if (latest) {
    setDirectionalInput(input, latest);
    return;
  }

  clearPlayerInput(input);
}

function getButtonInput(button) {
  return {
    x: Number(button.dataset.thrustX),
    y: Number(button.dataset.thrustY)
  };
}
