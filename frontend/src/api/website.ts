import { WebsiteProps } from "../types/website";
import { fetchJSON } from "../utils/api-helpers";

export const getWebsiteData = async (
  websiteId: string
): Promise<WebsiteProps> => fetchJSON("GET", `/websites/${websiteId}`);
