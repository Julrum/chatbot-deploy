import {
  HttpError,
  CrawlRequest, 
  CrawlRetryConfig, 
  DuplicateCrawlStrategy,
  HYSUApiResponse
} from "@orca.ai/pulse";

function validateRetryConfig(retryConfig: CrawlRetryConfig): void {
  if (!retryConfig) {
    throw new HttpError(400, "Bad Request, retryConfig is empty");
  }
  if (!retryConfig.maxRetry) {
    throw new HttpError(400, "Bad Request, maxRetry is empty");
  }
  if (retryConfig.maxRetry < 0) {
    throw new HttpError(400, "Bad Request, maxRetry must be positive");
  }
  if (retryConfig.intervalInMilliseconds !== undefined && retryConfig.intervalInMilliseconds < 0) {
    throw new HttpError(400, "Bad Request, intervalInMilliseconds must be positive");
  }
}

function validateDuplicateCrawlStrategy(duplicateCrawlStrategy: DuplicateCrawlStrategy): void {
  if (!duplicateCrawlStrategy) {
    throw new HttpError(400, "Bad Request, duplicateCrawlStrategy is empty");
  }
  if (!Object.values(DuplicateCrawlStrategy).includes(duplicateCrawlStrategy)) {
    throw new HttpError(400, "Bad Request, duplicateCrawlStrategy is invalid");
  }
}

export function validateCrawlRequest(request: CrawlRequest): void {
  if (!request) {
    throw new HttpError(400, "Bad Request, body is empty");
  }
  if (!request.minId || !request.maxId || !request.websiteId || !request.retryConfig || !request.duplicateCrawlStrategy) {
    throw new HttpError(400, "Bad Request, minId is empty");
  }
  if (request.minId < 0) {
    throw new HttpError(400, "Bad Request, minId must be positive");
  }
  if (request.maxId < 0) {
    throw new HttpError(400, "Bad Request, maxId must be positive");
  }
  if (request.minId > request.maxId) {
    throw new HttpError(400, "Bad Request, minId must be less than maxId");
  }
  validateRetryConfig(request.retryConfig);
  validateDuplicateCrawlStrategy(request.duplicateCrawlStrategy);
}

export function isValidResponse(response: any): boolean {
  const r = response as HYSUApiResponse;
  return (r.response !== undefined || r.response !== null) &&
  (r.message !== undefined || r.message !== null) &&
  (r.data !== undefined || r.data !== null) &&
  (r.code !== undefined || r.code !== null);
}
