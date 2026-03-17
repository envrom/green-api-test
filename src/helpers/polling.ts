import { config } from '../config/env';

interface PollOptions {
  /** How often to call the predicate, in ms. Defaults to config.pollIntervalMs */
  intervalMs?: number;
  /** Give up after this many ms. Defaults to config.pollTimeoutMs */
  timeoutMs?: number;
  /** Human-readable description shown in the timeout error */
  description?: string;
}

/**
 * Repeatedly calls `fn` until it returns a truthy value or the timeout expires.
 *
 * - Does NOT use blind sleep: the next tick starts immediately after `fn` resolves.
 * - Throws a descriptive error on timeout so failures are easy to diagnose.
 *
 * @returns The first truthy value returned by `fn`.
 */
export async function pollUntil<T>(
  fn: () => Promise<T | null | undefined | false>,
  options: PollOptions = {},
): Promise<T> {
  const intervalMs = options.intervalMs ?? config.pollIntervalMs;
  const timeoutMs  = options.timeoutMs  ?? config.pollTimeoutMs;
  const description = options.description ?? 'condition';

  const deadline = Date.now() + timeoutMs;

  while (true) {
    const result = await fn();

    if (result) {
      return result as T;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new Error(
        `[polling] Timed out after ${timeoutMs}ms waiting for: ${description}`
      );
    }

    // Wait for the next interval, but never past the deadline
    await sleep(Math.min(intervalMs, remaining));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
