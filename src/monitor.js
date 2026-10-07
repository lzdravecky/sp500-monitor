import {
  calculateDrawdown,
  getReachedThresholds,
} from "./domain/drawdown.js";

export function evaluateMarket(
  instrument,
  marketData,
  previousState,
) {
  if (!previousState?.ath) {
    throw new Error(
      `Missing ATH state for ${instrument.symbol}`,
    );
  }

  const state = {
    ...previousState,

    triggeredThresholds: [
      ...(previousState.triggeredThresholds ?? []),
    ],

    disarmedThresholds: [
      ...(previousState.disarmedThresholds ?? []),
    ],
  };

  const events = [];

  // New all-time high starts a completely new cycle.
  if (marketData.price > state.ath.price) {
    const previousAth = state.ath;

    state.ath = {
      price: marketData.price,
      timestamp: marketData.timestamp,
    };

    state.triggeredThresholds = [];
    state.disarmedThresholds = [];

    events.push({
      type: "NEW_ATH",
      symbol: instrument.symbol,
      previousAth,
      newAth: state.ath,
    });
  }

  const drawdown = calculateDrawdown(
    marketData.price,
    state.ath.price,
  );

  // Rearm repeatable thresholds after sufficient recovery.
  for (const threshold of instrument.repeatableThresholds) {
    const rearmLevel =
      threshold - instrument.rearmRecovery;

    if (
      state.disarmedThresholds.includes(threshold) &&
      drawdown < rearmLevel
    ) {
      state.disarmedThresholds =
        state.disarmedThresholds.filter(
          (value) => value !== threshold,
        );
    }
  }

  const reachedThresholds = getReachedThresholds(
    drawdown,
    instrument.thresholds,
  );

  for (const threshold of reachedThresholds) {
    const isRepeatable =
      instrument.repeatableThresholds.includes(
        threshold,
      );

    if (isRepeatable) {
      // Repeatable threshold can fire whenever it is armed.
      if (
        !state.disarmedThresholds.includes(threshold)
      ) {
        events.push({
          type: "DRAWDOWN_THRESHOLD",
          symbol: instrument.symbol,
          threshold,
          drawdown,
          currentPrice: marketData.price,
          ath: state.ath,
          timestamp: marketData.timestamp,
        });

        state.disarmedThresholds.push(threshold);
      }

      continue;
    }

    // Non-repeatable thresholds fire only once per ATH cycle.
    if (
      !state.triggeredThresholds.includes(threshold)
    ) {
      events.push({
        type: "DRAWDOWN_THRESHOLD",
        symbol: instrument.symbol,
        threshold,
        drawdown,
        currentPrice: marketData.price,
        ath: state.ath,
        timestamp: marketData.timestamp,
      });

      state.triggeredThresholds.push(threshold);
    }
  }

  return {
    state,
    drawdown,
    events,
  };
}