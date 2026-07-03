import { Component } from "./ecs/components.js";
import { queryEntities } from "./ecs/world.js";
import { createSimulation } from "./game/simulation.js";
import { sunlight } from "./game/lighting.js";
import { clearPlayerInput, createPlayerInput, bindThrusterControls, setGunAim, setGunShooting, setKeyboardAcceleration, setKeyboardShooting, setKeyboardThrusters, syncPlayerInputControls } from "./input/playerInput.js";
import { getTestMap, TestMapId } from "./scenes/testMaps.js";
import { createCamera, fitCameraToWorld, screenToWorld } from "./rendering/camera.js";
import { renderWorld } from "./rendering/canvasRenderer.js";
import { applyConfiguredLabels } from "./ui/labels.js";
import { createShipStatusView, updateShipStatus } from "./ui/shipStatusPanel.js";
import { syncToggleButtons } from "./ui/toggles.js";

const canvas = document.querySelector("#gravity-canvas");
const context = canvas.getContext("2d");
const shipStatusView = createShipStatusView();
const levelMenu = document.querySelector("#level-menu");
const gameOverOverlay = document.querySelector("#game-over");
const thrusterControls = document.querySelector("#thruster-controls");

const playerInput = createPlayerInput();
const camera = createCamera();

let activeMap = getTestMap(TestMapId.LevelSelect);
let world = activeMap.createWorld();
let simulation = createSimulation(world, { inputById: { "player-one": playerInput } });
let mapHasPlayerFleet = hasPlayerShip();
let previousTimestamp = performance.now();

function hasPlayerShip() {
  return queryEntities(world, [Component.PlayerControlled]).length > 0;
}

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
  updatePanels();
  requestAnimationFrame(tick);
}

function updatePanels() {
  updateShipStatus(shipStatusView, world);
  gameOverOverlay.classList.toggle("is-hidden", !mapHasPlayerFleet || hasPlayerShip());
}

function switchTestMap(mapId) {
  activeMap = getTestMap(mapId);
  world = activeMap.createWorld();
  simulation = createSimulation(world, { inputById: { "player-one": playerInput } });
  mapHasPlayerFleet = hasPlayerShip();
  clearPlayerInput(playerInput);
  syncPlayerInputControls(thrusterControls, playerInput);
  syncMapButtons();
  syncLevelMenu();
  resizeCanvas();
  updatePanels();
}

function syncMapButtons() {
  syncToggleButtons(document, "[data-test-map]", (button) => button.dataset.testMap === activeMap.id);
}

function syncLevelMenu() {
  levelMenu.classList.toggle("is-hidden", !activeMap.isMenu);
  thrusterControls.classList.toggle("is-hidden", Boolean(activeMap.isMenu));
}

function bindMapMenu() {
  for (const button of document.querySelectorAll("[data-test-map]")) {
    button.addEventListener("click", () => {
      switchTestMap(button.dataset.testMap);
    });
  }

  for (const button of document.querySelectorAll("[data-retry]")) {
    button.addEventListener("click", () => {
      switchTestMap(activeMap.id);
    });
  }
}

function bindKeyboardThrusterControls() {
  window.addEventListener("keydown", (event) => handleThrusterKey(event, true, !event.repeat));
  window.addEventListener("keyup", (event) => handleThrusterKey(event, false, true));
}

function bindGunPointerControls() {
  canvas.addEventListener("pointermove", updateGunAimFromPointer);
  canvas.addEventListener("pointerdown", (event) => {
    updateGunAimFromPointer(event);
    setGunShooting(playerInput, true);
  });
  for (const eventName of ["pointerup", "pointercancel", "pointerleave"]) {
    canvas.addEventListener(eventName, () => setGunShooting(playerInput, false));
  }
}

function updateGunAimFromPointer(event) {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const point = screenToWorld(camera, canvas, {
    x: (event.clientX - bounds.left) * pixelRatio,
    y: (event.clientY - bounds.top) * pixelRatio
  });
  setGunAim(playerInput, point.x, point.y);
}

function handleThrusterKey(event, pressed, allowAcceleration) {
  if (setKeyboardShooting(playerInput, event.code, pressed)) {
    event.preventDefault();
    return;
  }

  if (allowAcceleration && setKeyboardAcceleration(playerInput, event.code, pressed)) {
    event.preventDefault();
    syncPlayerInputControls(thrusterControls, playerInput);
    return;
  }

  if (event.repeat || !setKeyboardThrusters(playerInput, event.code, pressed)) {
    return;
  }

  event.preventDefault();
  syncPlayerInputControls(thrusterControls, playerInput);
}

window.addEventListener("resize", resizeCanvas);
applyConfiguredLabels();
bindThrusterControls(thrusterControls, playerInput);
bindKeyboardThrusterControls();
bindGunPointerControls();
bindMapMenu();
syncMapButtons();
syncLevelMenu();
resizeCanvas();
requestAnimationFrame(tick);
