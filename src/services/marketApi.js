const BASE_URL = "https://eodhd.com/api";

export async function getLatestPrice(symbol, apiToken) {
  const url =
    `${BASE_URL}/eod/${symbol}` +
    `?api_token=${apiToken}&fmt=json&period=d&order=d`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `EODHD request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No market data returned for ${symbol}`);
  }

  const latest = data[0];

  return {
    symbol,
    date: latest.date,
    price: latest.close,
  };
}

export async function getHistoricalAth(symbol, apiToken) {
  const url =
    `${BASE_URL}/eod/${symbol}` +
    `?api_token=${apiToken}&fmt=json&period=d&order=a`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `EODHD historical request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No historical data returned for ${symbol}`);
  }

  let ath = null;

  for (const candle of data) {
    const high = Number(candle.high);

    if (!Number.isFinite(high)) {
      continue;
    }

    if (!ath || high > ath.price) {
      ath = {
        price: high,
        timestamp: new Date(candle.date).toISOString(),
      };
    }
  }

  if (!ath) {
    throw new Error(`Unable to calculate historical ATH for ${symbol}`);
  }

  return ath;
}
