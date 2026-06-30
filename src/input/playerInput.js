export function createPlayerInput() {
  return {
    active: false,
    x: 0,
    y: 0,
    strength: 0
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

function getCenter(element) {
  const bounds = element.getBoundingClientRect();
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2
  };
}
