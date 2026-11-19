import test from "node:test";
import assert from "node:assert/strict";
import { PressedKeys } from "./input.ts";
test("a chord releases each key independently", () => {
  const keys = new PressedKeys();
  keys.press("KeyQ", "q");
  keys.press("KeyW", "w");
  keys.release("KeyQ");
  assert.equal(keys.has("q"), false);
  assert.equal(keys.has("w"), true);
});
test("both physical Shift keys and pointer overlap keep the key held", () => {
  const keys = new PressedKeys();
  keys.press("ShiftLeft", "shift");
  keys.press("ShiftRight", "shift");
  keys.press("pointer:1", "shift");
  keys.release("ShiftLeft");
  keys.release("pointer:1");
  assert.equal(keys.has("shift"), true);
  keys.release("ShiftRight");
  assert.equal(keys.has("shift"), false);
});
test("repeat events are ignored and blur clears all input sources", () => {
  const keys = new PressedKeys();
  assert.equal(keys.press("KeyQ", "q"), true);
  assert.equal(keys.press("KeyQ", "q"), false);
  keys.press("pointer:2", "w");
  keys.clear();
  assert.equal(keys.snapshot().size, 0);
});
