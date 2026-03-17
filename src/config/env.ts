import type { AppConfig } from '../types/greenApi.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `[config] Missing required environment variable: ${name}\n` +
      `Copy .env.example to .env and fill in the values.`
    );
  }
  return value.trim();
}

function optionalEnvInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value || value.trim() === '') return defaultValue;
  const parsed = parseInt(value.trim(), 10);
  if (isNaN(parsed)) {
    throw new Error(`[config] Environment variable ${name} must be a valid integer, got: "${value}"`);
  }
  return parsed;
}

// ─── Build & export config ────────────────────────────────────────────────────

export const config: AppConfig = {
  baseUrl:        requireEnv('GREEN_API_BASE_URL'),
  idInstance:     requireEnv('GREEN_API_ID_INSTANCE'),
  tokenInstance:  requireEnv('GREEN_API_TOKEN_INSTANCE'),
  chatId:         requireEnv('GREEN_API_CHAT_ID'),
  invalidChatId:  process.env['GREEN_API_INVALID_CHAT_ID'] ?? 'invalid-id',
  historyCount:   optionalEnvInt('GREEN_API_HISTORY_COUNT', 20),
  pollIntervalMs: optionalEnvInt('GREEN_API_POLL_INTERVAL_MS', 3000),
  pollTimeoutMs:  optionalEnvInt('GREEN_API_POLL_TIMEOUT_MS', 60000),
};
