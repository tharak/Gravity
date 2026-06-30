import { createSimulation } from "./game/simulation.js";
import { sunlight } from "./game/lighting.js";
import { createPlayerInput, bindTouchJoystick } from "./input/playerInput.js";
import { createStarterScene } from "./scenes/starterScene.js";
import { createCamera, fitCameraToWorld } from "./rendering/camera.js";
import { renderWorld } from "./rendering/canvasRenderer.js";

const canvas = document.querySelector("#gravity-canvas");
const context = canvas.getContext("2d");
const hudTime = document.querySelector("#hud-time");
const hudEntities = document.querySelector("#hud-entities");
const hudStatus = document.querySelector("#hud-status");
const joystick = document.querySelector("#touch-joystick");

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
  requestAnimationFrame(tick);
}

function updateHud() {
  hudTime.textContent = `${world.time.toFixed(1)}s`;
  hudEntities.textContent = String(world.entities.size);
  hudStatus.textContent = playerInput.active ? "Thrusting" : "Running";
}

window.addEventListener("resize", resizeCanvas);
bindTouchJoystick(joystick, playerInput);
resizeCanvas();
requestAnimationFrame(tick);
