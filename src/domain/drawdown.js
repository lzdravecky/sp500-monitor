export function calculateDrawdown(currentPrice, athPrice) {
  if (athPrice <= 0) {
    throw new Error("ATH price must be greater than 0");
  }

  return ((athPrice - currentPrice) / athPrice) * 100;
}

export function getReachedThresholds(drawdown, thresholds) {
  return thresholds.filter((threshold) => drawdown >= threshold);
}