import { LabelConfig } from "../config/labelConfig.js";

export function applyConfiguredLabels(root = document) {
  document.title = LabelConfig.appTitle;
  for (const element of root.querySelectorAll("[data-label]")) {
    element.textContent = getLabelValue(element.dataset.label) ?? element.textContent;
  }
  for (const element of root.querySelectorAll("[data-aria-label]")) {
    element.setAttribute("aria-label", getLabelValue(element.dataset.ariaLabel) ?? element.getAttribute("aria-label"));
  }
  document.documentElement.style.setProperty("--label-locked", JSON.stringify(LabelConfig.controls.locked));
  document.documentElement.style.setProperty("--label-manual-short", JSON.stringify(LabelConfig.controllerModes.manualShort));
}

function getLabelValue(path) {
  return path.split(".").reduce((value, key) => value?.[key], LabelConfig);
}
