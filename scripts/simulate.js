import { monitorConfig } from "../src/config.js";
import { evaluateMarket } from "../src/monitor.js";
import { applyXetraContext } from "../src/domain/xetraFollowUp.js";
import { formatNotification } from "../src/notifications/notificationFormatter.js";

const instrument = {
  ...monitorConfig.triggerInstrument,

  // Simplified ATH makes the simulation easy to read.
  initialAth: 100,
};

const referenceInstrument = {
  ath: {
    price: 735.02,
  },
};

let state = {
  ath: {
    price: 100,
    date: "2026-01-01",
  },
  triggeredThresholds: [],
  disarmedThresholds: [],
};

function simulate(
  price,
  xetraIsOpen,
  timestamp,
) {
  const marketData = {
    symbol: instrument.symbol,
    price,
    timestamp,
  };

  const result = evaluateMarket(
    instrument,
    marketData,
    state,
  );

  const xetra = {
    isOpen: xetraIsOpen,
    status: xetraIsOpen
      ? "OPEN"
      : "CLOSED",
  };

  applyXetraContext(
    result.events,
    result.state,
    xetra,
    timestamp,
  );

  state = result.state;

  console.log("");
  console.log("================================");
  console.log(`PRICE:    ${price} USD`);
  console.log(
    `DRAWDOWN: -${result.drawdown.toFixed(2)} %`,
  );
  console.log(`XETRA:    ${xetra.status}`);
  console.log("================================");

  if (result.events.length === 0) {
    console.log("No notification.");
    return;
  }

  for (const event of result.events) {
    console.log("");
    console.log(
      formatNotification(
        event,
        referenceInstrument,
      ),
    );
  }
}

console.log("S&P 500 MONITOR — SIMULATION");

simulate(
  96,
  false,
  "2026-09-21T18:00:00.000Z",
);

simulate(
  94,
  false,
  "2026-09-21T18:05:00.000Z",
);

simulate(
  89,
  false,
  "2026-09-21T18:10:00.000Z",
);

simulate(
  93,
  true,
  "2026-09-22T08:00:00.000Z",
);

simulate(
  89,
  true,
  "2026-09-22T08:05:00.000Z",
);

simulate(
  84,
  true,
  "2026-09-22T08:10:00.000Z",
);

simulate(
  101,
  true,
  "2026-09-22T08:15:00.000Z",
);