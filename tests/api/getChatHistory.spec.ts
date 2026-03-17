import { GreenApiClient } from '../../src/api/greenApiClient';
import { config } from '../../src/config/env';
import { assertInstanceAuthorized } from '../../src/helpers/assertions';
import type { ChatHistoryMessage, GetStateInstanceResponse } from '../../src/types/greenApi.types';

/**
 * Test suite: getChatHistory
 *
 * Covers positive and negative scenarios for the POST /getChatHistory endpoint.
 */
describe('POST /getChatHistory', () => {
  let client: GreenApiClient;

  beforeAll(async () => {
    client = new GreenApiClient();

    const stateResponse = await client.getStateInstance();
    assertInstanceAuthorized(stateResponse.data as GetStateInstanceResponse);
  });

  // ─── Positive cases ──────────────────────────────────────────────────────────

  describe('positive cases', () => {
    it('fetching history for a valid chatId returns HTTP 200', async () => {
      const response = await client.getChatHistory(config.chatId);

      expect(response.status).toBe(200);
    });

    it('response body is an array (or empty string for empty chats)', async () => {
      const response = await client.getChatHistory(config.chatId);
      const data = response.data;

      // GREEN-API returns an empty string "" instead of [] when the chat has no history.
      // Both are valid "empty" responses — an array (possibly empty) or an empty string.
      const isAcceptable = Array.isArray(data) || data === '' || data === null;
      if (!isAcceptable) {
        console.info(`[getChatHistory] Unexpected response.data type: ${typeof data}, value: ${JSON.stringify(data)}`);
      }
      expect(isAcceptable).toBe(true);
    });

    it('each message in the array has required fields', async () => {
      const response = await client.getChatHistory(config.chatId);
      const messages = response.data as ChatHistoryMessage[];

      if (messages.length === 0) {
        // Empty history is valid — no assertions to make about individual messages
        console.info('[getChatHistory] Chat history is empty — field checks skipped.');
        return;
      }

      const first = messages[0];
      expect(first).toHaveProperty('type');
      expect(first).toHaveProperty('idMessage');
      expect(first).toHaveProperty('timestamp');
      expect(first).toHaveProperty('typeMessage');
      expect(first).toHaveProperty('chatId');
    });

    it('"timestamp" is a positive number', async () => {
      const response = await client.getChatHistory(config.chatId);
      const messages = response.data as ChatHistoryMessage[];

      if (messages.length === 0) return;

      messages.forEach(msg => {
        expect(typeof msg.timestamp).toBe('number');
        expect(msg.timestamp).toBeGreaterThan(0);
      });
    });

    it('"type" field is either "incoming" or "outgoing"', async () => {
      const response = await client.getChatHistory(config.chatId);
      const messages = response.data as ChatHistoryMessage[];

      if (messages.length === 0) return;

      messages.forEach(msg => {
        expect(['incoming', 'outgoing']).toContain(msg.type);
      });
    });

    describe('count parameter', () => {
      it('count=1 returns at most 1 message', async () => {
        const response = await client.getChatHistory(config.chatId, 1);
        const messages = response.data as ChatHistoryMessage[];

        expect(messages.length).toBeLessThanOrEqual(1);
      });

      it('count=5 returns at most 5 messages', async () => {
        const response = await client.getChatHistory(config.chatId, 5);
        const messages = response.data as ChatHistoryMessage[];

        expect(messages.length).toBeLessThanOrEqual(5);
      });

      it(`count=${config.historyCount} (from config) returns at most ${config.historyCount} messages`, async () => {
        const response = await client.getChatHistory(config.chatId, config.historyCount);
        const messages = response.data as ChatHistoryMessage[];

        expect(messages.length).toBeLessThanOrEqual(config.historyCount);
      });
    });
  });

  // ─── Negative cases ──────────────────────────────────────────────────────────

  describe('negative cases', () => {
    it('missing chatId — request is rejected (status not 200)', async () => {
      const response = await client.getChatHistoryRaw({ count: 5 });

      expect(response.status).not.toBe(200);
    });

    it('invalid chatId format — request is rejected (status not 200)', async () => {
      const response = await client.getChatHistoryRaw({
        chatId: config.invalidChatId,
        count: 5,
      });

      expect(response.status).not.toBe(200);
    });

    it('empty body — request is rejected (status not 200)', async () => {
      const response = await client.getChatHistoryRaw({});

      expect(response.status).not.toBe(200);
    });

    it('null body — request is rejected (status not 200)', async () => {
      const response = await client.getChatHistoryRaw(null);

      expect(response.status).not.toBe(200);
    });

    it('count as a string instead of number — request is rejected or sanitised', async () => {
      // GREEN-API may coerce the string or reject it. We only assert the
      // request does not crash the test runner and returns a valid HTTP status.
      const response = await client.getChatHistoryRaw({
        chatId: config.chatId,
        count: 'not-a-number',
      });

      // Acceptable outcomes: 400 (ideal), 200 (lenient server), or 429 (rate limited)
      expect([200, 400, 429]).toContain(response.status);
    });
  });
});
