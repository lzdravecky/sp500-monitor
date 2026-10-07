import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateDrawdown,
  getReachedThresholds,
} from "../src/domain/drawdown.js";

test("calculates drawdown correctly", () => {
  const drawdown = calculateDrawdown(80, 100);

  assert.equal(drawdown, 20);
});

test("returns reached thresholds", () => {
  const thresholds = [5, 10, 15, 20, 25];

  const reached = getReachedThresholds(
    17,
    thresholds
  );

  assert.deepEqual(reached, [5, 10, 15]);
});

test("returns no thresholds for small drawdown", () => {
  const thresholds = [5, 10, 15, 20];

  const reached = getReachedThresholds(
    4.99,
    thresholds
  );

  assert.deepEqual(reached, []);
});