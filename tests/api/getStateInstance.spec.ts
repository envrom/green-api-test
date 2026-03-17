import { GreenApiClient } from '../../src/api/greenApiClient';
import type { GetStateInstanceResponse } from '../../src/types/greenApi.types';

/**
 * Test suite: getStateInstance
 *
 * Verifies that the GREEN-API instance responds correctly and is authorised.
 * This suite acts as a health-check — if it fails, the other suites will also fail.
 */
describe('GET /getStateInstance', () => {
  let client: GreenApiClient;
  let stateInstance: string;

  beforeAll(async () => {
    client = new GreenApiClient();
  });

  // ─── Happy path ─────────────────────────────────────────────────────────────

  describe('successful request', () => {
    let body: GetStateInstanceResponse;
    let status: number;

    beforeAll(async () => {
      const response = await client.getStateInstance();
      status = response.status;
      body = response.data as GetStateInstanceResponse;
      stateInstance = body?.stateInstance ?? '';
    });

    it('returns HTTP 200', () => {
      expect(status).toBe(200);
    });

    it('response body contains the "stateInstance" field', () => {
      expect(body).toHaveProperty('stateInstance');
    });

    it('"stateInstance" is a non-empty string', () => {
      expect(typeof stateInstance).toBe('string');
      expect(stateInstance.length).toBeGreaterThan(0);
    });

    it('"stateInstance" is "authorized" — instance is ready for messaging', () => {
      if (stateInstance !== 'authorized') {
        const hint =
          `Instance state is "${stateInstance}" instead of "authorized".\n` +
          `Open your GREEN-API cabinet, check the instance, and scan the QR code if needed.\n` +
          `sendMessage / getChatHistory / e2e tests will fail until this is resolved.`;
        // Fail with a clear diagnostic rather than a bare assertion mismatch
        throw new Error(hint);
      }
      expect(stateInstance).toBe('authorized');
    });
  });

  // ─── Diagnostics ────────────────────────────────────────────────────────────

  describe('diagnostics', () => {
    it('logs the current instance state for visibility', () => {
      // Reuses the cached `body` from the outer beforeAll — no extra API call
      console.info(`[diagnostic] stateInstance = "${stateInstance}"`);
      expect(typeof stateInstance).toBe('string');
    });
  });
});
