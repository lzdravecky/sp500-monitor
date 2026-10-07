import test from "node:test";
import assert from "node:assert/strict";

import { formatNotification } from "../src/notifications/notificationFormatter.js";

const referenceInstrument = {
  ath: {
    price: 735.02,
    date: "2026-09-23",
  },
};

test("formats drawdown threshold notification", () => {
  const event = {
    type: "DRAWDOWN_THRESHOLD",
    threshold: 10,
    drawdown: 10.24,
    currentPrice: 699.56,
    ath: {
      price: 779.37,
    },
    xetraStatus: "CLOSED",
  };

  const notification = formatNotification(
    event,
    referenceInstrument,
  );

  assert.match(
    notification,
    /S&P 500 DRAWDOWN — 10 %/,
  );

  assert.match(
    notification,
    /Current price: 699.56 USD/,
  );

  assert.match(
    notification,
    /ATH:\s+779.37 USD/,
  );

  assert.match(
    notification,
    /Drawdown:\s+-10.24 %/,
  );

  assert.match(
    notification,
    /EUR ATH:\s+735.02 EUR/,
  );

  assert.match(
    notification,
    /Xetra:\s+CLOSED/,
  );
});

test("formats new ATH notification", () => {
  const event = {
    type: "NEW_ATH",
    previousAth: {
      price: 779.37,
    },
    newAth: {
      price: 781.25,
    },
  };

  const notification = formatNotification(
    event,
    referenceInstrument,
  );

  assert.match(
    notification,
    /S&P 500 NEW ATH/,
  );

  assert.match(
    notification,
    /Previous ATH: 779.37 USD/,
  );

  assert.match(
    notification,
    /New ATH:\s+781.25 USD/,
  );

  assert.match(
    notification,
    /thresholds have been reset/,
  );
});

test("formats Xetra open follow-up", () => {
  const event = {
    type: "XETRA_OPEN_FOLLOWUP",
    threshold: 20,
    originalDrawdown: 20.42,
  };

  const notification = formatNotification(
    event,
    referenceInstrument,
  );

  assert.match(
    notification,
    /SXR8 \/ XETRA IS OPEN/,
  );

  assert.match(
    notification,
    /-20 % threshold/,
  );

  assert.match(
    notification,
    /SXR8 EUR ATH: 735.02 EUR/,
  );

  assert.match(
    notification,
    /Check the current SXR8 price in XTB/,
  );
});