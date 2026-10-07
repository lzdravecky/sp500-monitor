export const monitorConfig = {
  triggerInstrument: {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    currency: "USD",

    // Temporary bootstrap value.
    // We will replace this with verified historical ATH data.
    initialAth: null,

    thresholds: [5, 10, 15, 20, 25, 30, 40, 50],

    repeatableThresholds: [10, 15, 20, 25, 30, 40, 50],

    // A repeatable threshold becomes armed again
    // after the market recovers by this many percentage points.
    rearmRecovery: 2.5,
  },

  referenceInstrument: {
    symbol: "SXR8.XETRA",
    name: "SXR8 — iShares Core S&P 500 UCITS ETF",
    currency: "EUR",

    // Informational value shown in alerts.
    // We will bootstrap/verify this from historical data.
    initialAth: null,
  },

  exchanges: {
    xetra: {
      timezone: "Europe/Berlin",
      open: "09:00",
      close: "17:30",
    },

    us: {
      timezone: "America/New_York",
      open: "09:30",
      close: "16:00",
    },
  },
};
