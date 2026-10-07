import { pool } from "./database.js";

function mapMonitorState(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    symbol: row.symbol,
    athPrice: Number(row.ath_price),
    athRecordedAt: row.ath_recorded_at,
    pendingXetraThreshold:
      row.pending_xetra_threshold === null
        ? null
        : Number(row.pending_xetra_threshold),
    pendingXetraDrawdown:
      row.pending_xetra_drawdown === null
        ? null
        : Number(row.pending_xetra_drawdown),
    pendingXetraTriggeredAt: row.pending_xetra_triggered_at,
  };
}

export async function getMonitorState(symbol) {
  const result = await pool.query(
    `
      SELECT
        id,
        symbol,
        ath_price,
        ath_recorded_at,
        pending_xetra_threshold,
        pending_xetra_drawdown,
        pending_xetra_triggered_at
      FROM monitor_state
      WHERE symbol = $1
    `,
    [symbol],
  );

  return mapMonitorState(result.rows[0]);
}

export async function getThresholdStates(monitorStateId) {
  const result = await pool.query(
    `
      SELECT
        threshold,
        status
      FROM threshold_state
      WHERE monitor_state_id = $1
      ORDER BY threshold
    `,
    [monitorStateId],
  );

  return result.rows.map((row) => ({
    threshold: Number(row.threshold),
    status: row.status,
  }));
}

export async function initializeThresholdStates(monitorStateId, thresholds) {
  for (const threshold of thresholds) {
    await pool.query(
      `
        INSERT INTO threshold_state (
          monitor_state_id,
          threshold,
          status
        )
        VALUES ($1, $2, 'ARMED')
        ON CONFLICT (monitor_state_id, threshold)
        DO NOTHING
      `,
      [monitorStateId, threshold],
    );
  }
}

export async function updateThresholdStatus(monitorStateId, threshold, status) {
  await pool.query(
    `
      UPDATE threshold_state
      SET status = $1
      WHERE monitor_state_id = $2
        AND threshold = $3
    `,
    [status, monitorStateId, threshold],
  );
}

export async function loadState(symbol) {
  const monitorState = await getMonitorState(symbol);

  if (!monitorState) {
    return null;
  }

  const thresholds = await getThresholdStates(monitorState.id);

  return {
    id: monitorState.id,

    ath: {
      price: monitorState.athPrice,
      timestamp: monitorState.athRecordedAt,
    },

    triggeredThresholds: thresholds
      .filter((item) => item.status === "TRIGGERED")
      .map((item) => item.threshold),

    disarmedThresholds: thresholds
      .filter((item) => item.status === "DISARMED")
      .map((item) => item.threshold),

    pendingXetraFollowUp:
      monitorState.pendingXetraThreshold === null
        ? null
        : {
            threshold: monitorState.pendingXetraThreshold,
            drawdown: monitorState.pendingXetraDrawdown,
            triggeredAt: monitorState.pendingXetraTriggeredAt,
          },
  };
}

export async function updateAth(monitorStateId, athPrice, athRecordedAt) {
  await pool.query(
    `
      UPDATE monitor_state
      SET
        ath_price = $1,
        ath_recorded_at = $2
      WHERE id = $3
    `,
    [athPrice, athRecordedAt, monitorStateId],
  );
}

export async function updatePendingXetraFollowUp(
  monitorStateId,
  pendingFollowUp,
) {
  await pool.query(
    `
      UPDATE monitor_state
      SET
        pending_xetra_threshold = $1,
        pending_xetra_drawdown = $2,
        pending_xetra_triggered_at = $3
      WHERE id = $4
    `,
    [
      pendingFollowUp?.threshold ?? null,
      pendingFollowUp?.drawdown ?? null,
      pendingFollowUp?.triggeredAt ?? null,
      monitorStateId,
    ],
  );
}

export async function saveMarketHistory({
  symbol,
  price,
  athPrice,
  drawdown,
  recordedAt,
}) {
  await pool.query(
    `
      INSERT INTO market_history (
        symbol,
        price,
        ath_price,
        drawdown,
        recorded_at
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [symbol, price, athPrice, drawdown, recordedAt],
  );
}

export async function saveEvent({
  symbol,
  eventType,
  threshold,
  price,
  drawdown,
  recordedAt,
}) {
  await pool.query(
    `
      INSERT INTO events (
        symbol,
        event_type,
        threshold,
        price,
        drawdown,
        recorded_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [symbol, eventType, threshold, price, drawdown, recordedAt],
  );
}

export async function saveState(monitorStateId, state, thresholds) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
    UPDATE monitor_state
    SET
      ath_price = $1,
      ath_recorded_at = $2,
      pending_xetra_threshold = $3,
      pending_xetra_drawdown = $4,
      pending_xetra_triggered_at = $5
    WHERE id = $6
  `,
      [
        state.ath.price,
        state.ath.timestamp,
        state.pendingXetraFollowUp?.threshold ?? null,
        state.pendingXetraFollowUp?.drawdown ?? null,
        state.pendingXetraFollowUp?.triggeredAt ?? null,
        monitorStateId,
      ],
    );

    for (const threshold of thresholds) {
      let status = "ARMED";

      if (state.triggeredThresholds.includes(threshold)) {
        status = "TRIGGERED";
      } else if (state.disarmedThresholds.includes(threshold)) {
        status = "DISARMED";
      }

      await client.query(
        `
      UPDATE threshold_state
      SET status = $1
      WHERE monitor_state_id = $2
        AND threshold = $3
    `,
        [status, monitorStateId, threshold],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createMonitorState(symbol, athPrice, athRecordedAt) {
  const result = await pool.query(
    `
      INSERT INTO monitor_state (
        symbol,
        ath_price,
        ath_recorded_at
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        symbol,
        ath_price,
        ath_recorded_at,
        pending_xetra_threshold,
        pending_xetra_drawdown,
        pending_xetra_triggered_at
    `,
    [symbol, athPrice, athRecordedAt],
  );

  return mapMonitorState(result.rows[0]);
}

export async function ensureMonitorState(
  symbol,
  historicalAth,
  thresholds = [],
) {
  let monitorState = await getMonitorState(symbol);

  if (!monitorState) {
    monitorState = await createMonitorState(
      symbol,
      historicalAth.price,
      historicalAth.timestamp,
    );
  }

  if (thresholds.length > 0) {
    await initializeThresholdStates(monitorState.id, thresholds);
  }

  return monitorState;
}
