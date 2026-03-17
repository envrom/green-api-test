// ─── Request payloads ───────────────────────────────────────────────────────

export interface SendMessagePayload {
  chatId: string;
  message: string;
}

export interface GetChatHistoryPayload {
  chatId: string;
  count?: number;
}

// ─── Response bodies ─────────────────────────────────────────────────────────

/**
 * Response from GET /getStateInstance
 * https://green-api.com/en/docs/api/account/GetStateInstance/
 */
export interface GetStateInstanceResponse {
  stateInstance: string;
  // "authorized" | "notAuthorized" | "sleepMode" | "starting"
}

/**
 * Response from POST /sendMessage
 * https://green-api.com/en/docs/api/sending/SendMessage/
 */
export interface SendMessageResponse {
  idMessage: string;
}

/**
 * A single message entry in getChatHistory response array.
 * https://green-api.com/en/docs/api/journals/GetChatHistory/
 */
export interface ChatHistoryMessage {
  type: 'outgoing' | 'incoming';
  idMessage: string;
  timestamp: number;
  typeMessage: string;        // "textMessage" | "extendedTextMessage" | "imageMessage" | etc.
  chatId: string;
  senderId?: string;
  senderName?: string;
  textMessage?: string;       // present when typeMessage === "textMessage"
  downloadUrl?: string;
  caption?: string;
}

// ─── Config shape ─────────────────────────────────────────────────────────────

export interface AppConfig {
  baseUrl: string;
  idInstance: string;
  tokenInstance: string;
  chatId: string;
  invalidChatId: string;
  historyCount: number;
  pollIntervalMs: number;
  pollTimeoutMs: number;
}
