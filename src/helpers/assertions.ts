import type { GetStateInstanceResponse, ChatHistoryMessage } from '../types/greenApi.types';

/**
 * Asserts that the GREEN-API instance is in the "authorized" state.
 *
 * Call this in beforeAll of any test suite that depends on an active session.
 * Provides a clear diagnostic message instead of a cryptic downstream failure.
 */
export function assertInstanceAuthorized(
  stateResponse: GetStateInstanceResponse,
): void {
  const { stateInstance } = stateResponse;

  if (stateInstance !== 'authorized') {
    throw new Error(
      `[assertions] GREEN-API instance is NOT authorized.\n` +
      `Current state: "${stateInstance}"\n` +
      `Expected:      "authorized"\n\n` +
      `Possible causes:\n` +
      `  - The QR code has not been scanned in your GREEN-API cabinet.\n` +
      `  - The instance is in sleep mode — wake it up in the cabinet.\n` +
      `  - Wrong GREEN_API_ID_INSTANCE or GREEN_API_TOKEN_INSTANCE in .env.\n\n` +
      `Tests that require an authorised instance will be skipped / fail until this is fixed.`
    );
  }
}

/**
 * Text message type values observed from GREEN-API.
 *
 * GREEN-API classifies plain text as "textMessage" but messages with
 * formatting, links, or certain content as "extendedTextMessage".
 * Both carry the human-readable text in the `textMessage` field.
 */
const TEXT_MESSAGE_TYPES = new Set(['textMessage', 'extendedTextMessage']);

/**
 * Returns true if `message` is a text-based message.
 */
export function isTextMessage(message: ChatHistoryMessage): boolean {
  return TEXT_MESSAGE_TYPES.has(message.typeMessage);
}

/**
 * Finds the first message in `history` whose textMessage equals `text`.
 * Returns undefined if not found.
 */
export function findMessageByText(
  history: ChatHistoryMessage[],
  text: string,
): ChatHistoryMessage | undefined {
  return history.find(
    m => isTextMessage(m) && m.textMessage === text,
  );
}
