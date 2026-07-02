import { Component } from "../ecs/components.js";
import { getComponent, queryEntities } from "../ecs/world.js";

export function getShipPartEntities(world, ship, types = []) {
  return queryEntities(world, [Component.Parent, ...types])
    .filter((entity) => getComponent(world, entity, Component.Parent).entity === ship);
}

export function getShipThrusters(world, ship) {
  return getShipPartEntities(world, ship, [Component.Thruster])
    .map((entity) => getComponent(world, entity, Component.Thruster));
}

export function getShipSolarPanels(world, ship) {
  return getShipPartEntities(world, ship, [Component.SolarPanel])
    .map((entity) => getComponent(world, entity, Component.SolarPanel));
}
