import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type {
  GetStateInstanceResponse,
  SendMessagePayload,
  SendMessageResponse,
  GetChatHistoryPayload,
  ChatHistoryMessage,
} from '../types/greenApi.types';
import { config } from '../config/env';

// ─── URL builder ──────────────────────────────────────────────────────────────

/**
 * Builds an endpoint URL following the GREEN-API convention:
 *   <baseUrl>/waInstance<idInstance>/<method>/<tokenInstance>
 *
 * Keeping this centralised means adding a new method is a one-liner.
 */
function buildUrl(method: string): string {
  return `${config.baseUrl}/waInstance${config.idInstance}/${method}/${config.tokenInstance}`;
}

// ─── Client factory ───────────────────────────────────────────────────────────

function createHttpClient(): AxiosInstance {
  return axios.create({
    // No baseURL here — full URL is built per request so each endpoint is explicit
    timeout: 15_000,
    headers: {
      'Content-Type': 'application/json',
    },
    // Do NOT throw on non-2xx so tests can inspect error responses
    validateStatus: () => true,
  });
}

// ─── GreenApiClient ───────────────────────────────────────────────────────────

export class GreenApiClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = createHttpClient();
  }

  /**
   * GET /getStateInstance
   * Returns the authorisation state of the instance.
   */
  async getStateInstance(): Promise<AxiosResponse<GetStateInstanceResponse>> {
    return this.http.get<GetStateInstanceResponse>(buildUrl('getStateInstance'));
  }

  /**
   * POST /sendMessage
   * Sends a text message to the given WhatsApp chat.
   */
  async sendMessage(
    chatId: string,
    message: string,
  ): Promise<AxiosResponse<SendMessageResponse>> {
    const payload: SendMessagePayload = { chatId, message };
    return this.http.post<SendMessageResponse>(buildUrl('sendMessage'), payload);
  }

  /**
   * POST /sendMessage — raw overload used by negative tests that need to send
   * arbitrary/malformed payloads without TypeScript complaints.
   */
  async sendMessageRaw(payload: unknown): Promise<AxiosResponse<unknown>> {
    return this.http.post<unknown>(buildUrl('sendMessage'), payload);
  }

  /**
   * POST /getChatHistory
   * Returns the message history for a chat.
   */
  async getChatHistory(
    chatId: string,
    count: number = config.historyCount,
  ): Promise<AxiosResponse<ChatHistoryMessage[]>> {
    const payload: GetChatHistoryPayload = { chatId, count };
    return this.http.post<ChatHistoryMessage[]>(buildUrl('getChatHistory'), payload);
  }

  /**
   * POST /getChatHistory — raw overload for negative tests.
   */
  async getChatHistoryRaw(payload: unknown): Promise<AxiosResponse<unknown>> {
    return this.http.post<unknown>(buildUrl('getChatHistory'), payload);
  }
}
