import { MessageProps } from "../types/message";
import { fetchJSON } from "../utils/api-helpers";

export const getMessages = async (
  websiteId: string,
  sessionId: string
): Promise<MessageProps[]> =>
  fetchJSON("GET", `/websites/${websiteId}/sessions/${sessionId}/messages`);

export const sendMessage = async (
  websiteId: string,
  sessionId: string,
  message: string
): Promise<MessageProps> =>
  fetchJSON("POST", `/websites/${websiteId}/sessions/${sessionId}/messages`, {
    children: [
      {
        content: message,
        role: "user",
      },
    ],
  });

export const getReply = async (
  websiteId: string,
  sessionId: string,
  messageId: string
): Promise<MessageProps> =>
  fetchJSON(
    "GET",
    `/websites/${websiteId}/sessions/${sessionId}/messages/${messageId}/reply`
  );
