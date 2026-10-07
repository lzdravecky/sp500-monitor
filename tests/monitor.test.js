import test from "node:test";
import assert from "node:assert/strict";

import { evaluateMarket } from "../src/monitor.js";

const instrument = {
  symbol: "SPY",
  thresholds: [5, 10, 15, 20, 25, 30, 40, 50],
  repeatableThresholds: [10, 15, 20, 25, 30, 40, 50],
  rearmRecovery: 2.5,
};

function createState() {
  return {
    ath: {
      price: 100,
      date: "2026-01-01",
    },
    triggeredThresholds: [],
  };
}

function marketData(price) {
  return {
    symbol: "SPY",
    price,
    timestamp: "2026-09-25T12:00:00.000Z",
  };
}

test("does not trigger below first threshold", () => {
  const result = evaluateMarket(instrument, marketData(96), createState());

  assert.equal(result.drawdown, 4);
  assert.equal(result.events.length, 0);
});

test("triggers 5 percent threshold", () => {
  const result = evaluateMarket(instrument, marketData(95), createState());

  assert.equal(result.events.length, 1);

  assert.equal(result.events[0].type, "DRAWDOWN_THRESHOLD");

  assert.equal(result.events[0].threshold, 5);
});

test("triggers all newly crossed thresholds", () => {
  const result = evaluateMarket(instrument, marketData(79), createState());

  const thresholds = result.events
    .filter((event) => event.type === "DRAWDOWN_THRESHOLD")
    .map((event) => event.threshold);

  assert.deepEqual(thresholds, [5, 10, 15, 20]);
});

test("does not trigger the same threshold twice", () => {
  const state = createState();

  const first = evaluateMarket(instrument, marketData(89), state);

  const second = evaluateMarket(instrument, marketData(88), first.state);

  assert.deepEqual(
    first.events.map((event) => event.threshold),
    [5, 10],
  );

  assert.equal(second.events.length, 0);
});

test("triggers only newly reached threshold", () => {
  const state = createState();

  const first = evaluateMarket(instrument, marketData(89), state);

  const second = evaluateMarket(instrument, marketData(84), first.state);

  assert.deepEqual(
    second.events.map((event) => event.threshold),
    [15],
  );
});

test("new ATH resets triggered thresholds", () => {
  const state = {
    ath: {
      price: 100,
      date: "2026-01-01",
    },
    triggeredThresholds: [5, 10, 15],
  };

  const result = evaluateMarket(instrument, marketData(101), state);

  assert.equal(result.events[0].type, "NEW_ATH");

  assert.equal(result.state.ath.price, 101);

  assert.deepEqual(result.state.triggeredThresholds, []);

  assert.equal(result.drawdown, 0);
});

test("repeatable threshold does not trigger again without sufficient recovery", () => {
  const first = evaluateMarket(instrument, marketData(89), createState());

  const second = evaluateMarket(instrument, marketData(91), first.state);

  const third = evaluateMarket(instrument, marketData(89), second.state);

  const tenPercentEvents = third.events.filter(
    (event) => event.type === "DRAWDOWN_THRESHOLD" && event.threshold === 10,
  );

  assert.equal(tenPercentEvents.length, 0);
});

test("repeatable threshold rearms after 2.5 percentage point recovery", () => {
  const first = evaluateMarket(instrument, marketData(89), createState());

  // Drawdown = 7 %, enough recovery from the 10 % threshold.
  const recovery = evaluateMarket(instrument, marketData(93), first.state);

  const secondDrop = evaluateMarket(instrument, marketData(89), recovery.state);

  const tenPercentEvents = secondDrop.events.filter(
    (event) => event.type === "DRAWDOWN_THRESHOLD" && event.threshold === 10,
  );

  assert.equal(tenPercentEvents.length, 1);
});

test("5 percent threshold remains once per ATH cycle", () => {
  const first = evaluateMarket(instrument, marketData(94), createState());

  const recovery = evaluateMarket(instrument, marketData(99), first.state);

  const secondDrop = evaluateMarket(instrument, marketData(94), recovery.state);

  const fivePercentEvents = secondDrop.events.filter(
    (event) => event.type === "DRAWDOWN_THRESHOLD" && event.threshold === 5,
  );

  assert.equal(fivePercentEvents.length, 0);
});

test("multiple repeatable thresholds can rearm independently", () => {
  const firstDrop = evaluateMarket(instrument, marketData(84), createState());

  assert.deepEqual(
    firstDrop.events
      .filter((event) => event.type === "DRAWDOWN_THRESHOLD")
      .map((event) => event.threshold),
    [5, 10, 15],
  );

  const recovery = evaluateMarket(instrument, marketData(93), firstDrop.state);

  const secondDrop = evaluateMarket(instrument, marketData(84), recovery.state);

  assert.deepEqual(
    secondDrop.events
      .filter((event) => event.type === "DRAWDOWN_THRESHOLD")
      .map((event) => event.threshold),
    [10, 15],
  );
});
