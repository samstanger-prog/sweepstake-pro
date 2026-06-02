export function isMockDataEnabled(): boolean {
  return process.env.USE_MOCK_DATA !== "false";
}
