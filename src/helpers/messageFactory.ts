/**
 * Generates a unique message text that can be reliably identified in chat history.
 *
 * Pattern:  autotest-<timestamp>-<random6hex>
 * Example:  autotest-1718000000000-a3f91c
 *
 * The combination of epoch ms + random suffix makes collisions practically impossible
 * even when multiple test runs execute within the same millisecond.
 */
export function generateUniqueMessage(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0');
  return `autotest-${timestamp}-${random}`;
}
