import { LabelConfig } from "./config/labelConfig.js";
import { Component } from "./ecs/components.js";
import { getComponent, queryEntities } from "./ecs/world.js";
import { createSimulation } from "./game/simulation.js";
import { sunlight } from "./game/lighting.js";
import { ControllerMode, DirectionOrders, SpeedOrders, clearPlayerInput, createPlayerInput, bindThrusterControls, setKeyboardAcceleration, setKeyboardThrusters, syncPlayerInputControls } from "./input/playerInput.js";
import { getTestMap, TestMapId } from "./scenes/testMaps.js";
import { createCamera, fitCameraToWorld } from "./rendering/camera.js";
import { renderWorld } from "./rendering/canvasRenderer.js";

const canvas = document.querySelector("#gravity-canvas");
const context = canvas.getContext("2d");
const hudTime = document.querySelector("#hud-time");
const hudEntities = document.querySelector("#hud-entities");
const hudStatus = document.querySelector("#hud-status");
const hudMap = document.querySelector("#hud-map");
const mapButtons = [...document.querySelectorAll("[data-test-map]")];
const levelMenu = document.querySelector("#level-menu");
const thrusterControls = document.querySelector("#thruster-controls");
const batteryPercent = document.querySelector("#battery-percent");
const shipHealth = document.querySelector("#ship-health");
const batteryBars = [...document.querySelectorAll(".battery-widget__bar")];

const playerInput = createPlayerInput();
const camera = createCamera();

let activeMap = getTestMap(TestMapId.LevelSelect);
let world = activeMap.createWorld();
let simulation = createSimulation(world, { inputById: { "player-one": playerInput } });
let previousTimestamp = performance.now();

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(bounds.width * pixelRatio));
  canvas.height = Math.max(1, Math.floor(bounds.height * pixelRatio));
  context.setTransform(1, 0, 0, 1, 0, 0);
  fitCameraToWorld(camera, canvas, world);
}

function tick(timestamp) {
  const deltaSeconds = (timestamp - previousTimestamp) / 1000;
  previousTimestamp = timestamp;

  simulation.step(deltaSeconds);
  renderWorld(context, canvas, world, camera, { lightPosition: sunlight });
  updateHud();
  updateControls();
  requestAnimationFrame(tick);
}

function updateHud() {
  hudTime.textContent = `${world.time.toFixed(1)}s`;
  hudEntities.textContent = String(world.entities.size);
  hudStatus.textContent = getStatusText();
  hudMap.textContent = activeMap.label;
}

function getStatusText() {
  if (activeMap.isMenu) {
    return LabelConfig.status.chooseLevel;
  }

  if (playerInput.controllerMode === ControllerMode.Automatic) {
    const speed = SpeedOrders.find((order) => order.id === playerInput.speedOrder)?.label ?? playerInput.speedOrder;
    const direction = DirectionOrders.find((order) => order.id === playerInput.targetDirection)?.label ?? playerInput.targetDirection;
    return LabelConfig.status.auto + " " + speed + " " + direction;
  }

  if (playerInput.activeSlots.size > 0) {
    return LabelConfig.status.thrusting;
  }

  const player = queryEntities(world, [Component.PlayerControlled, Component.Velocity])[0];
  if (player === undefined) {
    return LabelConfig.status.running;
  }

  const velocity = getComponent(world, player, Component.Velocity);
  return Math.hypot(velocity.x, velocity.y) > 2 ? LabelConfig.status.coasting : LabelConfig.status.running;
}

function switchTestMap(mapId) {
  activeMap = getTestMap(mapId);
  world = activeMap.createWorld();
  simulation = createSimulation(world, { inputById: { "player-one": playerInput } });
  clearPlayerInput(playerInput);
  syncPlayerInputControls(thrusterControls, playerInput);
  syncMapButtons();
  syncLevelMenu();
  resizeCanvas();
  updateHud();
  updateControls();
}

function syncMapButtons() {
  for (const button of mapButtons) {
    const isActive = button.dataset.testMap === activeMap.id;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function syncLevelMenu() {
  levelMenu.classList.toggle("is-hidden", !activeMap.isMenu);
  thrusterControls.classList.toggle("is-hidden", Boolean(activeMap.isMenu));
}

function bindMapMenu() {
  for (const button of mapButtons) {
    button.addEventListener("click", () => {
      switchTestMap(button.dataset.testMap);
    });
  }
}

function bindKeyboardThrusterControls() {
  window.addEventListener("keydown", (event) => {
    if (!event.repeat && setKeyboardAcceleration(playerInput, event.code, true)) {
      event.preventDefault();
      syncPlayerInputControls(thrusterControls, playerInput);
      return;
    }

    if (event.repeat || !setKeyboardThrusters(playerInput, event.code, true)) {
      return;
    }

    event.preventDefault();
    syncPlayerInputControls(thrusterControls, playerInput);
  });

  window.addEventListener("keyup", (event) => {
    if (setKeyboardAcceleration(playerInput, event.code, false)) {
      event.preventDefault();
      syncPlayerInputControls(thrusterControls, playerInput);
      return;
    }

    if (!setKeyboardThrusters(playerInput, event.code, false)) {
      return;
    }

    event.preventDefault();
    syncPlayerInputControls(thrusterControls, playerInput);
  });
}

function applyConfiguredLabels(root = document) {
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

function formatHealthValue(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function updateControls() {
  const player = queryEntities(world, [Component.PlayerControlled, Component.Battery])[0];
  if (player === undefined) {
    batteryPercent.textContent = "--%";
    shipHealth.textContent = "--/--";
    batteryBars.forEach((bar) => bar.classList.remove("is-filled"));
    return;
  }

  const health = getComponent(world, player, Component.Health);
  shipHealth.textContent = health
    ? formatHealthValue(health.current) + "/" + formatHealthValue(health.max)
    : "--/--";


  const battery = getComponent(world, player, Component.Battery);
  const percent = battery.capacity > 0 ? Math.round((battery.charge / battery.capacity) * 100) : 0;
  const filledBars = Math.ceil(percent / 20);
  batteryPercent.textContent = String(percent) + "%";
  batteryBars.forEach((bar, index) => {
    bar.classList.toggle("is-filled", index < filledBars);
  });
}

window.addEventListener("resize", resizeCanvas);
applyConfiguredLabels();
bindThrusterControls(thrusterControls, playerInput);
bindKeyboardThrusterControls();
bindMapMenu();
syncMapButtons();
syncLevelMenu();
resizeCanvas();
requestAnimationFrame(tick);
