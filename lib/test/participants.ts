/** Prefix for dry-run participants created via admin test setup */
export const TEST_PLAYER_PREFIX = "Test Player";

export function isTestPlayerName(name: string): boolean {
  return name.startsWith(TEST_PLAYER_PREFIX);
}

export function testPlayerNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${TEST_PLAYER_PREFIX} ${i + 1}`);
}
