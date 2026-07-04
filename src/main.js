import { BodyKind, Component, FactionId } from "./ecs/components.js";
import { getComponent, queryEntities } from "./ecs/world.js";
import { createSimulation } from "./game/simulation.js";
import { sunlight } from "./game/lighting.js";
import { clearPlayerInput, createPlayerInput, bindThrusterControls, setGunAim, setGunShooting, setKeyboardAcceleration, setKeyboardShooting, setKeyboardThrusters, syncPlayerInputControls } from "./input/playerInput.js";
import { getTestMap, TestMapId } from "./scenes/testMaps.js";
import { createCamera, fitCameraToBounds, fitCameraToWorld, screenToWorld } from "./rendering/camera.js";
import { renderWorld } from "./rendering/canvasRenderer.js";
import { renderSpaceMap } from "./rendering/spaceMapRenderer.js";
import { SpaceMapModelConfig, SpaceMapViewConfig } from "./config/spaceMapConfig.js";
import { findRegionAt } from "./game/spaceMap.js";
import { createCampaignState, getSelectedBattleRegion, hasConqueredAllRegions, isRegionConquered, markRegionConquered, resetCampaign, selectBattleRegion } from "./game/campaign.js";
import { applyConfiguredLabels } from "./ui/labels.js";
import { createShipStatusView, updateShipStatus } from "./ui/shipStatusPanel.js";
import { syncToggleButtons } from "./ui/toggles.js";

const canvas = document.querySelector("#gravity-canvas");
const context = canvas.getContext("2d");
const shipStatusView = createShipStatusView();
const levelMenu = document.querySelector("#level-menu");
const gameOverOverlay = document.querySelector("#game-over");
const battleWonOverlay = document.querySelector("#battle-won");
const gameWonOverlay = document.querySelector("#game-won");
const thrusterControls = document.querySelector("#thruster-controls");

const playerInput = createPlayerInput();
const camera = createCamera();
const campaign = createCampaignState();

let activeMap = getTestMap(TestMapId.SpaceMap);
let world = activeMap.createWorld();
let simulation = createSimulation(world, { inputById: { "player-one": playerInput } });
let mapHasPlayerFleet = hasPlayerShip();
let mapIsBattle = false;
let battleResolved = false;
let previousTimestamp = performance.now();
let hoveredRegionIndex;

function hasPlayerShip() {
  return queryEntities(world, [Component.PlayerControlled]).length > 0;
}

function hasHostileShip() {
  return queryEntities(world, [Component.Faction, Component.BodyKind]).some((entity) =>
    getComponent(world, entity, Component.Faction).id === FactionId.Hostile
    && getComponent(world, entity, Component.BodyKind).value === BodyKind.Ship);
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(bounds.width * pixelRatio));
  canvas.height = Math.max(1, Math.floor(bounds.height * pixelRatio));
  context.setTransform(1, 0, 0, 1, 0, 0);
  if (world.spaceMap) {
    fitCameraToBounds(camera, canvas, world.spaceMap.bounds, SpaceMapViewConfig.padding);
  } else {
    fitCameraToWorld(camera, canvas, world);
  }
}

function tick(timestamp) {
  const deltaSeconds = (timestamp - previousTimestamp) / 1000;
  previousTimestamp = timestamp;

  simulation.step(deltaSeconds);
  if (world.spaceMap) {
    renderSpaceMap(context, canvas, world.spaceMap, camera, {
      hoveredRegionIndex,
      conqueredRegionIndexes: campaign.conqueredRegionIndexes
    });
  } else {
    renderWorld(context, canvas, world, camera, { lightPosition: sunlight });
  }
  updatePanels();
  requestAnimationFrame(tick);
}

function updatePanels() {
  updateShipStatus(shipStatusView, world);
  const playerDefeated = mapHasPlayerFleet && !hasPlayerShip();
  const battleWon = mapIsBattle && !playerDefeated && !hasHostileShip();

  if (battleWon && !battleResolved) {
    battleResolved = true;
    const region = getSelectedBattleRegion(campaign);
    if (region) {
      markRegionConquered(campaign, region.regionIndex);
    }
  }

  const gameWon = battleWon && hasConqueredAllRegions(campaign, SpaceMapModelConfig.regionCount);
  gameOverOverlay.classList.toggle("is-hidden", !playerDefeated);
  battleWonOverlay.classList.toggle("is-hidden", !battleWon || gameWon);
  gameWonOverlay.classList.toggle("is-hidden", !gameWon);
}

function switchTestMap(mapId) {
  activeMap = getTestMap(mapId);
  world = activeMap.createWorld({ battleRegion: getSelectedBattleRegion(campaign) });
  hoveredRegionIndex = undefined;
  simulation = createSimulation(world, { inputById: { "player-one": playerInput } });
  mapHasPlayerFleet = hasPlayerShip();
  mapIsBattle = activeMap.id === TestMapId.Battle;
  battleResolved = false;
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
  thrusterControls.classList.toggle("is-hidden", Boolean(activeMap.isMenu || activeMap.hidesCockpit));
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

  for (const button of document.querySelectorAll("[data-return-to-map]")) {
    button.addEventListener("click", () => {
      switchTestMap(TestMapId.SpaceMap);
    });
  }

  for (const button of document.querySelectorAll("[data-new-campaign]")) {
    button.addEventListener("click", () => {
      resetCampaign(campaign);
      switchTestMap(TestMapId.SpaceMap);
    });
  }
}

function bindKeyboardThrusterControls() {
  window.addEventListener("keydown", (event) => handleThrusterKey(event, true, !event.repeat));
  window.addEventListener("keyup", (event) => handleThrusterKey(event, false, true));
}

function bindGunPointerControls() {
  canvas.addEventListener("pointermove", (event) => {
    if (world.spaceMap) {
      const region = findRegionAt(world.spaceMap, pointerToWorld(event));
      hoveredRegionIndex = isRegionConquered(campaign, region.index) ? undefined : region.index;
      return;
    }
    updateGunAimFromPointer(event);
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (world.spaceMap) {
      selectSpaceMapRegion(event);
      return;
    }
    updateGunAimFromPointer(event);
    setGunShooting(playerInput, true);
  });
  for (const eventName of ["pointerup", "pointercancel", "pointerleave"]) {
    canvas.addEventListener(eventName, () => {
      hoveredRegionIndex = undefined;
      setGunShooting(playerInput, false);
    });
  }
}

function selectSpaceMapRegion(event) {
  const spaceMap = world.spaceMap;
  const region = findRegionAt(spaceMap, pointerToWorld(event));
  if (isRegionConquered(campaign, region.index)) {
    return;
  }
  selectBattleRegion(campaign, { regionIndex: region.index, seed: region.seed, spaceMapSeed: spaceMap.seed });
  switchTestMap(TestMapId.Battle);
}

function pointerToWorld(event) {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  return screenToWorld(camera, canvas, {
    x: (event.clientX - bounds.left) * pixelRatio,
    y: (event.clientY - bounds.top) * pixelRatio
  });
}

function updateGunAimFromPointer(event) {
  const point = pointerToWorld(event);
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
