CREATE INDEX idx_market_history_symbol_recorded_at
ON market_history (symbol, recorded_at DESC);