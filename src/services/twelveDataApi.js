const BASE_URL = "https://api.twelvedata.com";

export async function getCurrentPrice(symbol, apiKey) {
  const url =
    `${BASE_URL}/price` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&apikey=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Twelve Data request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (data.status === "error") {
    throw new Error(
      `Twelve Data error: ${data.message}`
    );
  }

  const price = Number(data.price);

  if (!Number.isFinite(price)) {
    throw new Error(
      `Invalid price returned for ${symbol}`
    );
  }

  return {
    symbol,
    price,
    timestamp: new Date().toISOString(),
  };
}

export async function getHistoricalAth(symbol, apiKey) {
  const url =
    `${BASE_URL}/time_series` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&interval=1day` +
    `&outputsize=5000` +
    `&order=ASC` +
    `&apikey=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Twelve Data historical request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (data.status === "error") {
    throw new Error(
      `Twelve Data historical error: ${data.message}`
    );
  }

  if (!Array.isArray(data.values) || data.values.length === 0) {
    throw new Error(
      `No historical data returned for ${symbol}`
    );
  }

  let ath = null;

  for (const candle of data.values) {
    const high = Number(candle.high);

    if (!Number.isFinite(high)) {
      continue;
    }

    if (!ath || high > ath.price) {
      ath = {
        price: high,
        timestamp: new Date(candle.datetime).toISOString(),
      };
    }
  }

  if (!ath) {
    throw new Error(
      `Unable to calculate historical ATH for ${symbol}`
    );
  }

  return ath;
}