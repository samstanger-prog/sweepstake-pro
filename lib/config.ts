export function isMockDataEnabled(): boolean {
  return process.env.USE_MOCK_DATA !== "false";
}

export function isWorldcup26SyncEnabled(): boolean {
  return process.env.WORLDCUP26_SYNC_ENABLED === "true";
}
