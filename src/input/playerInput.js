export function createPlayerInput() {
  return {
    active: false,
    alignWithShip: true,
    inverted: false,
    x: 0,
    y: 0,
    strength: 0,
    sideControls: {
      bottom: createSideControl(),
      top: createSideControl()
    }
  };
}

export function bindTouchJoystick(root, input) {
  const handle = root.querySelector(".touch-joystick__handle");
  const maxDistance = 40;
  let activePointerId = null;
  let center = { x: 0, y: 0 };

  function begin(pointerEvent) {
    activePointerId = pointerEvent.pointerId;
    root.setPointerCapture(activePointerId);
    center = getCenter(root);
    update(pointerEvent);
  }

  function update(pointerEvent) {
    if (activePointerId !== pointerEvent.pointerId) {
      return;
    }

    const dx = pointerEvent.clientX - center.x;
    const dy = pointerEvent.clientY - center.y;
    const distance = Math.hypot(dx, dy);
    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(dy, dx);
    const handleX = Math.cos(angle) * clampedDistance;
    const handleY = Math.sin(angle) * clampedDistance;

    input.active = distance > 4;
    input.x = input.active ? handleX / maxDistance : 0;
    input.y = input.active ? handleY / maxDistance : 0;
    input.strength = input.active ? clampedDistance / maxDistance : 0;
    handle.style.transform = `translate(${handleX}px, ${handleY}px)`;
  }

  function end(pointerEvent) {
    if (activePointerId !== pointerEvent.pointerId) {
      return;
    }

    activePointerId = null;
    input.active = false;
    input.x = 0;
    input.y = 0;
    input.strength = 0;
    handle.style.transform = "translate(0, 0)";
  }

  root.addEventListener("pointerdown", begin);
  root.addEventListener("pointermove", update);
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
}

export function bindSideThrusterControl(root, control) {
  const fill = root.querySelector(".side-thruster-control__fill");
  const maxDistance = 44;
  let activePointerId = null;
  let center = { x: 0, y: 0 };

  function begin(pointerEvent) {
    activePointerId = pointerEvent.pointerId;
    root.setPointerCapture(activePointerId);
    center = getCenter(root);
    update(pointerEvent);
  }

  function update(pointerEvent) {
    if (activePointerId !== pointerEvent.pointerId) {
      return;
    }

    const distance = Math.min(Math.hypot(pointerEvent.clientX - center.x, pointerEvent.clientY - center.y), maxDistance);
    control.active = distance > 4;
    control.strength = control.active ? distance / maxDistance : 0;
    fill.style.transform = `scaleX(${control.strength.toFixed(3)})`;
  }

  function end(pointerEvent) {
    if (activePointerId !== pointerEvent.pointerId) {
      return;
    }

    activePointerId = null;
    control.active = false;
    control.strength = 0;
    fill.style.transform = "scaleX(0)";
  }

  root.addEventListener("pointerdown", begin);
  root.addEventListener("pointermove", update);
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
}

function createSideControl() {
  return {
    active: false,
    strength: 0
  };
}

function getCenter(element) {
  const bounds = element.getBoundingClientRect();
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2
  };
}
