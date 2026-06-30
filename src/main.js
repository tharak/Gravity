import { createSimulation } from "./game/simulation.js";
import { createStarterScene } from "./scenes/starterScene.js";
import { createCamera } from "./rendering/camera.js";
import { renderWorld } from "./rendering/canvasRenderer.js";

const canvas = document.querySelector("#gravity-canvas");
const context = canvas.getContext("2d");
const hudTime = document.querySelector("#hud-time");
const hudEntities = document.querySelector("#hud-entities");
const hudStatus = document.querySelector("#hud-status");

const world = createStarterScene();
const simulation = createSimulation(world);
const camera = createCamera(canvas);

let previousTimestamp = performance.now();

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(bounds.width * pixelRatio));
  canvas.height = Math.max(1, Math.floor(bounds.height * pixelRatio));
  context.setTransform(1, 0, 0, 1, 0, 0);
}

function tick(timestamp) {
  const deltaSeconds = (timestamp - previousTimestamp) / 1000;
  previousTimestamp = timestamp;

  simulation.step(deltaSeconds);
  renderWorld(context, canvas, world, camera);
  updateHud();
  requestAnimationFrame(tick);
}

function updateHud() {
  hudTime.textContent = `${world.time.toFixed(1)}s`;
  hudEntities.textContent = String(world.entities.size);
  hudStatus.textContent = "Running";
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
requestAnimationFrame(tick);
