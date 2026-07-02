import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("renderer draws a world north indicator", () => {
  const source = fs.readFileSync(new URL("../src/rendering/canvasRenderer.js", import.meta.url), "utf8");

  assert.ok(source.includes("WORLD_NORTH_VECTOR"));
  assert.ok(source.includes("LabelConfig.readouts.worldNorthCanvas"));
});

test("cockpit shows world north readout", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

  assert.ok(html.includes('class="north-readout"'));
  assert.ok(html.includes("World N"));
});

test("renderer draws collision damage popups", () => {
  const source = fs.readFileSync(new URL("../src/rendering/canvasRenderer.js", import.meta.url), "utf8");

  assert.ok(source.includes("DamagePopup"));
  assert.ok(source.includes("formatDamage"));
});

test("renderer draws thrusters as force-direction cones", () => {
  const source = fs.readFileSync(new URL("../src/rendering/canvasRenderer.js", import.meta.url), "utf8");

  assert.ok(source.includes("drawThrusterCone"));
  assert.ok(source.includes("thruster.directionX"));
  assert.ok(source.includes("thruster.directionY"));
  assert.ok(source.includes("context.lineTo(baseX"));
});

test("renderer draws thrusters below the ship hull", () => {
  const source = fs.readFileSync(new URL("../src/rendering/canvasRenderer.js", import.meta.url), "utf8");
  const shipStart = source.indexOf("function drawShip");
  const shipEnd = source.indexOf("function drawThrusters", shipStart);
  const drawShipSource = source.slice(shipStart, shipEnd);

  assert.ok(drawShipSource.indexOf("drawThrusters") < drawShipSource.indexOf("context.rect"));
});

test("renderer scales thruster cones by power", () => {
  const source = fs.readFileSync(new URL("../src/rendering/canvasRenderer.js", import.meta.url), "utf8");

  assert.ok(source.includes("const visualPower = Math.max(0, thruster.power);"));
  assert.ok(source.includes("const powerScale = 0.45 + visualPower;"));
  assert.ok(source.includes("const length = baseLength * powerScale;"));
  assert.ok(source.includes("const glowScale = powerScale +"));
});
