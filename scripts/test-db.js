import "dotenv/config";
import { pool } from "../src/storage/database.js";
import {
  getMonitorState,
  getThresholdStates,
  initializeThresholdStates,
  updateThresholdStatus,
} from "../src/storage/stateRepository.js";

try {
  const state = await getMonitorState("SPY");
  await initializeThresholdStates(state.id, [5, 10, 15, 20, 25, 30, 40, 50]);
  await updateThresholdStatus(state.id, 10, "DISARMED");
  const thresholds = await getThresholdStates(state.id);

  console.log("Monitor state:");
  console.log(state);

  console.log("Threshold states:");
  console.log(thresholds);
} catch (error) {
  console.error("Database test failed:", error);
} finally {
  await pool.end();
}
