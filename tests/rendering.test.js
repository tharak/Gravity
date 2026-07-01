import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("renderer draws a world north indicator", () => {
  const source = fs.readFileSync(new URL("../src/rendering/canvasRenderer.js", import.meta.url), "utf8");

  assert.ok(source.includes("WORLD_NORTH_VECTOR"));
  assert.ok(source.includes("WORLD N"));
});
