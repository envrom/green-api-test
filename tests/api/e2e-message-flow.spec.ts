import { GreenApiClient } from '../../src/api/greenApiClient';
import { config } from '../../src/config/env';
import { generateUniqueMessage } from '../../src/helpers/messageFactory';
import { pollUntil } from '../../src/helpers/polling';
import {
  assertInstanceAuthorized,
  findMessageByText,
  isTextMessage,
} from '../../src/helpers/assertions';
import type {
  GetStateInstanceResponse,
  SendMessageResponse,
  ChatHistoryMessage,
} from '../../src/types/greenApi.types';

/**
 * End-to-end test suite: message send → history verify
 *
 * Scenario:
 *  1. Confirm the instance is authorised.
 *  2. Generate a unique message text.
 *  3. Send the message via sendMessage.
 *  4. Poll getChatHistory until the message appears (or timeout).
 *  5. Assert the found message has correct fields.
 *
 * Why polling?
 *   WhatsApp delivery is async. After sendMessage returns 200, the message may
 *   not yet appear in getChatHistory. We poll at `GREEN_API_POLL_INTERVAL_MS`
 *   intervals for up to `GREEN_API_POLL_TIMEOUT_MS` milliseconds before failing.
 */
describe('E2E: send message → verify in chat history', () => {
  let client: GreenApiClient;
  // Cached from beforeAll — reused in "step 1" test to avoid an extra API call
  let cachedStateResponse: GetStateInstanceResponse;

  // Give the whole suite enough time: send + polling window + buffer
  jest.setTimeout(config.pollTimeoutMs + 20_000);

  beforeAll(async () => {
    client = new GreenApiClient();

    // Guard: if the instance is not authorised the e2e test cannot proceed
    const response = await client.getStateInstance();
    cachedStateResponse = response.data as GetStateInstanceResponse;
    assertInstanceAuthorized(cachedStateResponse);
  });

  // ─── Step 1 — Instance authorisation check ───────────────────────────────────

  it('step 1: instance is authorized (getStateInstance)', () => {
    // Use the cached result from beforeAll — no extra API call needed here
    expect(cachedStateResponse).toHaveProperty('stateInstance');
    expect(cachedStateResponse.stateInstance).toBe('authorized');
  });

  // ─── Full flow ────────────────────────────────────────────────────────────────

  describe('full message flow', () => {
    let uniqueMessage: string;
    let idMessage: string;

    // Generate once for the whole describe block
    beforeAll(() => {
      uniqueMessage = generateUniqueMessage();
    });

    // ─── Step 2 + 3 — Send message ─────────────────────────────────────────────

    it('step 2-3: sends a unique text message and receives a successful response', async () => {
      const response = await client.sendMessage(config.chatId, uniqueMessage);
      const body = response.data as SendMessageResponse;

      expect(response.status).toBe(200);
      expect(body).toHaveProperty('idMessage');
      expect(body.idMessage).toBeTruthy();

      // Persist idMessage for the next assertion
      idMessage = body.idMessage;
      console.info(`[e2e] Message sent. idMessage="${idMessage}", text="${uniqueMessage}"`);
    });

    // ─── Step 4 + 5 — Poll history ─────────────────────────────────────────────

    it('step 4-5: message appears in getChatHistory within the polling window', async () => {
      // Use a larger count during polling so recently-sent messages are not missed
      const pollHistoryCount = Math.max(config.historyCount, 50);
      let pollAttempt = 0;

      const foundMessage = await pollUntil(
        async () => {
          pollAttempt += 1;
          const response = await client.getChatHistory(config.chatId, pollHistoryCount);

          if (response.status === 429) {
            console.warn('[e2e] Rate limited (429) — backing off 5 s before next poll');
            await new Promise<void>(r => setTimeout(r, 5000));
            return null;
          }

          if (response.status !== 200) {
            console.warn(`[e2e] getChatHistory returned ${response.status} during poll #${pollAttempt}`);
            return null;
          }

          // GREEN-API returns "" for an empty chat — treat as empty array
          const raw = response.data;
          const messages: ChatHistoryMessage[] = Array.isArray(raw) ? raw : [];

          // Log summary on first attempt and every 5th to aid debugging
          if (pollAttempt === 1 || pollAttempt % 5 === 0) {
            const preview = messages.slice(0, 3).map(m => ({
              type: m.type,
              typeMessage: m.typeMessage,
              text: m.textMessage?.slice(0, 40),
              chatId: m.chatId,
            }));
            console.info(
              `[e2e] Poll #${pollAttempt}: ${messages.length} messages in history.`,
              messages.length > 0 ? `First 3: ${JSON.stringify(preview)}` : '(empty)',
            );
          }

          return findMessageByText(messages, uniqueMessage) ?? null;
        },
        {
          description: `message with text "${uniqueMessage}" to appear in getChatHistory`,
          intervalMs: config.pollIntervalMs,
          timeoutMs: config.pollTimeoutMs,
        },
      );

      // ─── Step 6 + 7 — Verify found message ───────────────────────────────────

      console.info(`[e2e] Message found in history. idMessage="${foundMessage.idMessage}"`);

      // Correct text
      expect(foundMessage.textMessage).toBe(uniqueMessage);

      // Correct chat
      expect(foundMessage.chatId).toBe(config.chatId);

      // Must be classified as a text message.
      // GREEN-API uses "textMessage" or "extendedTextMessage" for text content —
      // both are valid and carry the text in the `textMessage` field.
      expect(isTextMessage(foundMessage)).toBe(true);
      expect(['textMessage', 'extendedTextMessage']).toContain(foundMessage.typeMessage);

      // Must be an outgoing message (we sent it)
      expect(foundMessage.type).toBe('outgoing');

      // idMessage from sendMessage response should match what is in history
      if (idMessage) {
        expect(foundMessage.idMessage).toBe(idMessage);
      }
    });
  });
});
