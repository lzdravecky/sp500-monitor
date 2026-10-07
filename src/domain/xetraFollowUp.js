export function applyXetraContext(
  events,
  state,
  xetraStatus,
  timestamp = new Date().toISOString()
) {
  const thresholdEvents = events.filter(
    (event) => event.type === "DRAWDOWN_THRESHOLD"
  );

  for (const event of thresholdEvents) {
    event.xetraStatus = xetraStatus.status;
  }

  // New threshold while Xetra is closed:
  // remember the highest threshold reached.
  if (!xetraStatus.isOpen && thresholdEvents.length > 0) {
    const latestEvent =
      thresholdEvents[thresholdEvents.length - 1];

    state.pendingXetraFollowUp = {
      threshold: latestEvent.threshold,
      drawdown: latestEvent.drawdown,
      triggeredAt: latestEvent.timestamp,
    };
  }

  // Xetra is open again and we have an unresolved
  // threshold from the time when it was closed.
  if (
    xetraStatus.isOpen &&
    state.pendingXetraFollowUp
  ) {
    const pending = state.pendingXetraFollowUp;

    events.push({
      type: "XETRA_OPEN_FOLLOWUP",
      threshold: pending.threshold,
      originalDrawdown: pending.drawdown,
      triggeredAt: pending.triggeredAt,
      timestamp,
    });

    state.pendingXetraFollowUp = null;
  }

  return {
    events,
    state,
  };
}