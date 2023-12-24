import { TextifyRequest } from "@orca.ai/pulse";

export function validateTextifyRequest(req: TextifyRequest): void {
  if (!req) {
    throw new Error("Request body is empty.");
  }
  if (!req.websiteId) {
    throw new Error("Request body is missing websiteId.");
  }
  if (!req.documentIds) {
    throw new Error("Request body is missing documentIds.");
  }
  if (!req.documentIds.length) {
    throw new Error("Request body has 0 documentIds.");
  }
}