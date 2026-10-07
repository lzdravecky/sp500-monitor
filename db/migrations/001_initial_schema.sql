CREATE TABLE monitor_state (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    ath_price NUMERIC(12,4) NOT NULL,
    ath_recorded_at TIMESTAMPTZ NOT NULL,
    pending_xetra_threshold NUMERIC(5,2),
    pending_xetra_drawdown NUMERIC(12,4),
    pending_xetra_triggered_at TIMESTAMPTZ
);

CREATE TABLE threshold_state (
    id BIGSERIAL PRIMARY KEY,
    monitor_state_id BIGINT NOT NULL REFERENCES monitor_state(id),
    threshold NUMERIC(5,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    UNIQUE (monitor_state_id, threshold)
);

CREATE TABLE market_history (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    price NUMERIC(12,4) NOT NULL,
    ath_price NUMERIC(12,4) NOT NULL,
    drawdown NUMERIC(12,4) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    threshold NUMERIC(5,2),
    price NUMERIC(12,4) NOT NULL,
    drawdown NUMERIC(12,4) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL
);