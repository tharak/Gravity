export function syncToggleButtons(root, selector, isActive) {
  for (const button of root.querySelectorAll(selector)) {
    const active = isActive(button);
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}
