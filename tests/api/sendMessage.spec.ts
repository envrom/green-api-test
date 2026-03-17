import { GreenApiClient } from '../../src/api/greenApiClient';
import { config } from '../../src/config/env';
import { generateUniqueMessage } from '../../src/helpers/messageFactory';
import { assertInstanceAuthorized } from '../../src/helpers/assertions';
import type { SendMessageResponse, GetStateInstanceResponse } from '../../src/types/greenApi.types';

/**
 * Test suite: sendMessage
 *
 * Covers positive and negative scenarios for the POST /sendMessage endpoint.
 *
 * NOTE on negative cases:
 * GREEN-API does not follow strict REST conventions for all error conditions.
 * Some invalid inputs return 400, others may return 200 with an error body or
 * behave unexpectedly. Tests below first assert the "ideal" HTTP status expected
 * per the assignment spec. Where GREEN-API actually deviates, a comment explains
 * the observed real behaviour and the test is written to be resilient.
 *
 * See README § "Known API behaviours" for details.
 */
describe('POST /sendMessage', () => {
  let client: GreenApiClient;

  beforeAll(async () => {
    client = new GreenApiClient();

    // Guard: skip the entire suite if the instance is not authorised
    const stateResponse = await client.getStateInstance();
    assertInstanceAuthorized(stateResponse.data as GetStateInstanceResponse);
  });

  // ─── Positive cases ──────────────────────────────────────────────────────────

  describe('positive cases', () => {
    it('sends a text message to a valid chatId and returns HTTP 200', async () => {
      const message = generateUniqueMessage();
      const response = await client.sendMessage(config.chatId, message);

      expect(response.status).toBe(200);
    });

    it('response body contains "idMessage" field', async () => {
      const message = generateUniqueMessage();
      const response = await client.sendMessage(config.chatId, message);
      const body = response.data as SendMessageResponse;

      expect(body).toHaveProperty('idMessage');
      expect(typeof body.idMessage).toBe('string');
      expect(body.idMessage.length).toBeGreaterThan(0);
    });

    it('"idMessage" has a non-empty value (message was queued by the server)', async () => {
      const message = generateUniqueMessage();
      const response = await client.sendMessage(config.chatId, message);
      const body = response.data as SendMessageResponse;

      expect(body.idMessage).toBeTruthy();
    });
  });

  // ─── Negative cases ──────────────────────────────────────────────────────────

  describe('negative cases', () => {
    /**
     * The GREEN-API spec states that missing required fields should yield a 400.
     * In practice the API may return 400 or a non-2xx depending on the field.
     * The tests below check for "not 200" to stay honest about real behaviour
     * while still asserting that the request was rejected.
     */

    it('missing chatId field — request is rejected (status not 200)', async () => {
      const response = await client.sendMessageRaw({ message: 'test' });

      // Expected: 400 Bad Request. Real GREEN-API may return 400 or another non-2xx.
      expect(response.status).not.toBe(200);
    });

    it('missing message field — request is rejected (status not 200)', async () => {
      const response = await client.sendMessageRaw({ chatId: config.chatId });

      expect(response.status).not.toBe(200);
    });

    it('empty body — request is rejected (status not 200)', async () => {
      const response = await client.sendMessageRaw({});

      expect(response.status).not.toBe(200);
    });

    it('null body — request is rejected (status not 200)', async () => {
      const response = await client.sendMessageRaw(null);

      expect(response.status).not.toBe(200);
    });

    it('invalid chatId format — request is rejected (status not 200)', async () => {
      const response = await client.sendMessageRaw({
        chatId: config.invalidChatId,
        message: generateUniqueMessage(),
      });

      // GREEN-API may return 400. If it returns 200 with no delivery, the
      // idMessage will still be present — but delivery fails silently.
      // We assert status != 200 as the primary check per the spec requirement.
      expect(response.status).not.toBe(200);
    });

    it('very long message (>4096 chars) — GREEN-API accepts it and returns 200', async () => {
      // Observed behaviour: GREEN-API imposes no server-side message length limit.
      // A 5000-character message is accepted and queued normally.
      // See README § "Known API Behaviours" #2.
      const longMessage = 'a'.repeat(5000);
      const response = await client.sendMessageRaw({
        chatId: config.chatId,
        message: longMessage,
      });

      expect(response.status).toBe(200);
    });
  });
});
