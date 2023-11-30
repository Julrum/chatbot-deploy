import { SessionProps } from "../types/session";
import { fetchJSON } from "../utils/api-helpers";

export const createSession = async (websiteId: string): Promise<SessionProps> =>
  fetchJSON("POST", `/websites/${websiteId}/sessions`);

export const getSession = async (
  websiteId: string,
  sessionId: string
): Promise<SessionProps> =>
  fetchJSON("GET", `/websites/${websiteId}/sessions/${sessionId}`);
