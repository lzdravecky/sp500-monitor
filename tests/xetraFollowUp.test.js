import test from "node:test";
import assert from "node:assert/strict";

import { applyXetraContext } from "../src/domain/xetraFollowUp.js";

function thresholdEvent(threshold) {
  return {
    type: "DRAWDOWN_THRESHOLD",
    threshold,
    drawdown: threshold + 0.2,
    timestamp: "2026-09-25T19:00:00.000Z",
  };
}

test("does not create pending follow-up when Xetra is open", () => {
  const events = [
    thresholdEvent(10),
  ];

  const state = {};

  applyXetraContext(
    events,
    state,
    {
      isOpen: true,
      status: "OPEN",
    }
  );

  assert.equal(
    state.pendingXetraFollowUp,
    undefined
  );

  assert.equal(
    events[0].xetraStatus,
    "OPEN"
  );
});

test("creates pending follow-up when threshold occurs while Xetra is closed", () => {
  const events = [
    thresholdEvent(10),
  ];

  const state = {};

  applyXetraContext(
    events,
    state,
    {
      isOpen: false,
      status: "CLOSED",
    }
  );

  assert.equal(
    state.pendingXetraFollowUp.threshold,
    10
  );

  assert.equal(
    events[0].xetraStatus,
    "CLOSED"
  );
});

test("keeps highest threshold reached while Xetra is closed", () => {
  const state = {};

  applyXetraContext(
    [thresholdEvent(10)],
    state,
    {
      isOpen: false,
      status: "CLOSED",
    }
  );

  applyXetraContext(
    [thresholdEvent(15)],
    state,
    {
      isOpen: false,
      status: "CLOSED",
    }
  );

  assert.equal(
    state.pendingXetraFollowUp.threshold,
    15
  );
});

test("creates follow-up event when Xetra opens again", () => {
  const events = [];

  const state = {
    pendingXetraFollowUp: {
      threshold: 20,
      drawdown: 20.4,
      triggeredAt:
        "2026-09-25T19:30:00.000Z",
    },
  };

  applyXetraContext(
    events,
    state,
    {
      isOpen: true,
      status: "OPEN",
    },
    "2026-09-28T07:00:00.000Z"
  );

  assert.equal(events.length, 1);

  assert.equal(
    events[0].type,
    "XETRA_OPEN_FOLLOWUP"
  );

  assert.equal(
    events[0].threshold,
    20
  );

  assert.equal(
    state.pendingXetraFollowUp,
    null
  );
});