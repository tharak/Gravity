import { LabelConfig } from "../config/labelConfig.js";
import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";
import { getShipPartEntities } from "../game/shipParts.js";

export function createShipStatusView(root = document) {
  return {
    batteryPercent: root.querySelector("#battery-percent"),
    shipHealth: root.querySelector("#ship-health"),
    ecList: root.querySelector("#ship-ec-list"),
    batteryBars: [...root.querySelectorAll(".battery-widget__bar")]
  };
}

export function updateShipStatus(view, world) {
  const player = queryEntities(world, [Component.PlayerControlled, Component.Battery])[0];
  if (player === undefined) {
    view.batteryPercent.textContent = "--%";
    view.shipHealth.textContent = "--/--";
    view.batteryBars.forEach((bar) => bar.classList.remove("is-filled"));
    updateShipEcList(view, world, undefined);
    return;
  }

  const health = getComponent(world, player, Component.Health);
  view.shipHealth.textContent = health ? formatHealth(health) : "--/--";

  const battery = getComponent(world, player, Component.Battery);
  const percent = battery.capacity > 0 ? Math.round((battery.charge / battery.capacity) * 100) : 0;
  const filledBars = Math.ceil(percent / 20);
  view.batteryPercent.textContent = String(percent) + "%";
  view.batteryBars.forEach((bar, index) => {
    bar.classList.toggle("is-filled", index < filledBars);
  });
  updateShipEcList(view, world, player);
}

function updateShipEcList(view, world, player) {
  const ecs = player === undefined ? [] : getShipEcRows(world, player);
  view.ecList.replaceChildren(...ecs.map(createShipEcRow));

  if (ecs.length === 0) {
    view.ecList.append(createEmptyEcRow());
  }
}

function getShipEcRows(world, ship) {
  return getShipPartEntities(world, ship, [Component.Health])
    .map((entity) => ({
      entity,
      label: getEcLabel(world, entity),
      health: getComponent(world, entity, Component.Health)
    }))
    .sort((a, b) => getEcSortValue(world, a.entity) - getEcSortValue(world, b.entity));
}

function createShipEcRow(ec) {
  const row = document.createElement("div");
  row.className = "ship-ec-row";

  const name = document.createElement("span");
  name.className = "ship-ec-row__name";
  name.textContent = ec.label;

  const hp = document.createElement("span");
  hp.className = "ship-ec-row__hp";
  hp.textContent = formatHealth(ec.health);

  row.append(name, hp);
  return row;
}

function createEmptyEcRow() {
  const empty = document.createElement("div");
  empty.className = "ship-ec-row";
  const label = document.createElement("span");
  label.className = "ship-ec-row__name";
  label.textContent = LabelConfig.ecs.empty;
  empty.append(label);
  return empty;
}

function getEcLabel(world, entity) {
  const thruster = getComponent(world, entity, Component.Thruster);
  if (thruster) {
    return LabelConfig.ecs.thruster + " " + thruster.number;
  }

  if (getComponent(world, entity, Component.Gun)) {
    return LabelConfig.ecs.gun;
  }

  if (getComponent(world, entity, Component.SolarPanel)) {
    return LabelConfig.ecs.solarPanel;
  }

  return String(entity);
}

function getEcSortValue(world, entity) {
  const thruster = getComponent(world, entity, Component.Thruster);
  if (thruster) {
    return thruster.number;
  }

  if (getComponent(world, entity, Component.Gun)) {
    return 90;
  }

  if (getComponent(world, entity, Component.SolarPanel)) {
    return 100;
  }

  return 1000;
}

function formatHealth(health) {
  return formatHealthValue(health.current) + "/" + formatHealthValue(health.max);
}

function formatHealthValue(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
