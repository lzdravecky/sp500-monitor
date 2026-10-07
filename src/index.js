import "dotenv/config";

import { monitorConfig } from "./config.js";
import { getCurrentPrice, getHistoricalAth } from "./services/twelveDataApi.js";
import {
  loadState,
  saveState,
  ensureMonitorState,
  saveMarketHistory,
  saveEvent,
} from "./storage/stateRepository.js";
import { evaluateMarket } from "./monitor.js";
import { getXetraStatus } from "./services/marketHours.js";
import { applyXetraContext } from "./domain/xetraFollowUp.js";
import { getHistoricalAth as getSxr8HistoricalAth } from "./services/marketApi.js";
import { formatNotification } from "./notifications/notificationFormatter.js";

const apiKey = process.env.TWELVE_DATA_API_KEY;
const eodhdApiToken = process.env.EODHD_API_TOKEN;

if (!apiKey) {
  throw new Error("Missing TWELVE_DATA_API_KEY");
}

if (!eodhdApiToken) {
  throw new Error("Missing EODHD_API_TOKEN");
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("sk-SK");
}

async function main() {
  console.log("S&P 500 Monitor started");

  const instrument = monitorConfig.triggerInstrument;

  const marketData = await getCurrentPrice(instrument.symbol, apiKey);

  console.log("");
  console.log(instrument.name);
  console.log(`Current price: ${marketData.price} ${instrument.currency} | ${formatDate(marketData.timestamp)}`,);

  let spyState = await loadState(instrument.symbol);

  if (!spyState) {
    console.log("No SPY state found in database.");
    console.log("Loading historical data...");

    const historicalAth = await getHistoricalAth(instrument.symbol, apiKey);

    await ensureMonitorState(
      instrument.symbol,
      historicalAth,
      instrument.thresholds,
    );

    spyState = await loadState(instrument.symbol);

    console.log(
      `Historical ATH: ${historicalAth.price} ${instrument.currency}`,
    );
  }

  const result = evaluateMarket(instrument, marketData, spyState);

  const referenceInstrument = monitorConfig.referenceInstrument;

  let sxr8State = await loadState(referenceInstrument.symbol);

  if (!sxr8State) {
    console.log("");
    console.log("No SXR8 EUR ATH state found in database.");
    console.log("Loading SXR8 historical data...");

    const historicalAth = await getSxr8HistoricalAth(
      referenceInstrument.symbol,
      eodhdApiToken,
    );

    await ensureMonitorState(referenceInstrument.symbol, historicalAth);

    sxr8State = await loadState(referenceInstrument.symbol);

    console.log(
      `SXR8 EUR ATH: ${sxr8State.ath.price} ${referenceInstrument.currency} | ${formatDate(sxr8State.ath.timestamp)}`,
    );
  }

  const xetra = getXetraStatus();

  applyXetraContext(result.events, result.state, xetra);

  await saveState(spyState.id, result.state, instrument.thresholds);

  await saveMarketHistory({
    symbol: instrument.symbol,
    price: marketData.price,
    athPrice: result.state.ath.price,
    drawdown: result.drawdown,
    recordedAt: marketData.timestamp,
  });

  console.log(`ATH:          ${result.state.ath.price} ${instrument.currency} | ${formatDate(result.state.ath.timestamp)}`,);

  console.log(`Drawdown:     ${result.drawdown.toFixed(2)} %`);

  console.log(
    `Xetra:        ${xetra.status} (${xetra.weekday} ${xetra.localTime})`,
  );

  console.log(
    `SXR8 EUR ATH: ${sxr8State.ath.price} ${referenceInstrument.currency} | ${formatDate(sxr8State.ath.timestamp)}`,
  );

  const referenceData = {
    ath: sxr8State.ath,
  };

  for (const event of result.events) {
    await saveEvent({
      symbol: event.symbol,
      eventType: event.type,
      threshold: event.threshold ?? null,
      price: event.currentPrice ?? result.state.ath.price,
      drawdown: event.drawdown ?? result.drawdown,
      recordedAt: event.timestamp ?? marketData.timestamp,
    });
    const notification = formatNotification(event, referenceData);

    console.log("");
    console.log("----- NOTIFICATION -----");
    console.log(notification);
    console.log("------------------------");
  }
}

main().catch((error) => {
  console.error("Monitor failed:", error);
  console.error("Stack:", error.stack);
});
