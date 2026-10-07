export function formatNotification(event, referenceInstrument) {
  switch (event.type) {
    case "DRAWDOWN_THRESHOLD":
      return formatDrawdownAlert(event, referenceInstrument);

    case "NEW_ATH":
      return formatNewAthAlert(event);

    case "XETRA_OPEN_FOLLOWUP":
      return formatXetraFollowUp(event, referenceInstrument);

    default:
      throw new Error(`Unsupported event type: ${event.type}`);
  }
}

function formatDrawdownAlert(event, referenceInstrument) {
  return [
    `S&P 500 DRAWDOWN — ${event.threshold} %`,
    "",
    "SPY",
    `Current price: ${event.currentPrice.toFixed(2)} USD`,
    `ATH:           ${event.ath.price.toFixed(2)} USD`,
    `Drawdown:      -${event.drawdown.toFixed(2)} %`,
    "",
    "SXR8",
    `EUR ATH:       ${referenceInstrument.ath.price.toFixed(2)} EUR`,
    `Xetra:         ${event.xetraStatus}`,
    "",
    `Threshold ${event.threshold} % reached.`,
  ].join("\n");
}

function formatNewAthAlert(event) {
  return [
    "S&P 500 NEW ATH",
    "",
    "SPY",
    `Previous ATH: ${event.previousAth.price.toFixed(2)} USD`,
    `New ATH:      ${event.newAth.price.toFixed(2)} USD`,
    "",
    "Drawdown thresholds have been reset.",
  ].join("\n");
}

function formatXetraFollowUp(event, referenceInstrument) {
  return [
    "SXR8 / XETRA IS OPEN",
    "",
    `S&P 500 reached the -${event.threshold} % threshold`,
    "while Xetra was closed.",
    "",
    `SXR8 EUR ATH: ${referenceInstrument.ath.price.toFixed(2)} EUR`,
    "",
    "Xetra is now open.",
    "Check the current SXR8 price in XTB.",
  ].join("\n");
}
