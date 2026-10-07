import test from "node:test";
import assert from "node:assert/strict";

import { getXetraStatus } from "../src/services/marketHours.js";

test("Xetra is open during weekday trading hours", () => {
  const date = new Date(
    "2026-09-25T14:00:00Z"
  );

  const result = getXetraStatus(date);

  assert.equal(result.isOpen, true);
  assert.equal(result.status, "OPEN");
});

test("Xetra is closed after trading hours", () => {
  const date = new Date(
    "2026-09-25T19:00:00Z"
  );

  const result = getXetraStatus(date);

  assert.equal(result.isOpen, false);
  assert.equal(result.status, "CLOSED");
});

test("Xetra is closed on weekend", () => {
  const date = new Date(
    "2026-09-26T12:00:00Z"
  );

  const result = getXetraStatus(date);

  assert.equal(result.isOpen, false);
  assert.equal(result.status, "CLOSED");
});