import { Component } from "./ecs/components.js";
import { getComponent, queryEntities } from "./ecs/world.js";
import { createSimulation } from "./game/simulation.js";
import { sunlight } from "./game/lighting.js";
import { ControllerMode, createPlayerInput, bindThrusterControls } from "./input/playerInput.js";
import { createStarterScene } from "./scenes/starterScene.js";
import { createCamera, fitCameraToWorld } from "./rendering/camera.js";
import { renderWorld } from "./rendering/canvasRenderer.js";

const canvas = document.querySelector("#gravity-canvas");
const context = canvas.getContext("2d");
const hudTime = document.querySelector("#hud-time");
const hudEntities = document.querySelector("#hud-entities");
const hudStatus = document.querySelector("#hud-status");
const thrusterControls = document.querySelector("#thruster-controls");
const batteryPercent = document.querySelector("#battery-percent");
const batteryBars = [...document.querySelectorAll(".battery-widget__bar")];

const world = createStarterScene();
const playerInput = createPlayerInput();
const simulation = createSimulation(world, { inputById: { "player-one": playerInput } });
const camera = createCamera();

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
}

function getStatusText() {
  if (playerInput.controllerMode === ControllerMode.Automatic) {
    return "Auto " + playerInput.speedOrder + " " + playerInput.targetDirection;
  }

  if (playerInput.activeSlots.size > 0) {
    return "Thrusting";
  }

  const player = queryEntities(world, [Component.PlayerControlled, Component.Velocity])[0];
  if (player === undefined) {
    return "Running";
  }

  const velocity = getComponent(world, player, Component.Velocity);
  return Math.hypot(velocity.x, velocity.y) > 2 ? "Coasting" : "Running";
}

function updateControls() {
  const player = queryEntities(world, [Component.PlayerControlled, Component.Battery])[0];
  if (player === undefined) {
    return;
  }

  const battery = getComponent(world, player, Component.Battery);
  const percent = battery.capacity > 0 ? Math.round((battery.charge / battery.capacity) * 100) : 0;
  const filledBars = Math.ceil(percent / 20);
  batteryPercent.textContent = String(percent) + "%";
  batteryBars.forEach((bar, index) => {
    bar.classList.toggle("is-filled", index < filledBars);
  });
}

window.addEventListener("resize", resizeCanvas);
bindThrusterControls(thrusterControls, playerInput);
resizeCanvas();
requestAnimationFrame(tick);
