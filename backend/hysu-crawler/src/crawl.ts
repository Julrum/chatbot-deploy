import { HttpError, ResourceName } from "@orca.ai/pulse";
import {
  HYSUApiResponse,
  CrawledDocument,
  HYSUCrawledDocument,
  CrawlRetryConfig,
  DuplicateCrawlStrategy,
  HYSUFile,
} from "@orca.ai/pulse";
import {
  isValidResponse,
} from "./type-utils";
import { HTMLElement, parse as parseHtml } from "node-html-parser";
import admin from "firebase-admin";

async function crawlSinglePage(id: string, url: string): Promise<CrawledDocument> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    throw new HttpError(500, `Error while fetching ${url}: ${e}`);
  }
  if (!response.ok) {
    throw new HttpError(response.status, `Error while fetching ${url}: ${JSON.stringify(response)}`);
  }
  let json: any;
  try {
    json = await response.json();
  } catch (e) {
    let text: string;
    try {
      text = await response.text();
    } catch (e) {
      throw new HttpError(500, `Error while parsing response from ${url}: ${e}`);
    }
    throw new HttpError(500, `Error while parsing response from ${url}: ${text}`);
  }
  if (!isValidResponse(json)) {
    throw new HttpError(500, `Failed to parse response from ${url}: ${json}`);
  }
  const r = json as HYSUApiResponse;
  const data = r.data;
  const root = parseHtml(data.content.content);
  const contentText = extractTextFromHtml(root);
  const imageUrls = extractImageUrlsFromHtml(root);
  const crawledDocument: HYSUCrawledDocument = {
    id,
    crawledAt: undefined,
    postedAt: data.content.regDate,
    url: url,
    imageUrls,
    fileUrls: data.files.map(urlOfCrawledFile),
    title: data.content.title,
    content: contentText,
    viewCnt: data.content.viewCnt,
    tags: [],
  };
  return crawledDocument;
}

interface CrawlError {
  id: undefined;
  url: string;
  message: string;
  stack: string;
}

export async function crawlSinglePageWithRetry(id: string, url: string, retryConfig: CrawlRetryConfig): Promise<CrawledDocument | CrawlError> {
  let retryCount = 0;
  while (true) {
    try {
      return await crawlSinglePage(id, url);
    } catch (e) {
      if (retryCount < retryConfig.maxRetry) {
        retryCount++;
        if (retryConfig.intervalInMilliseconds !== undefined && retryConfig.intervalInMilliseconds > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryConfig.intervalInMilliseconds));
        }
      } else {
        const error = e as HttpError;
        return {
          url,
          message: error.message,
          stack: error.stack,
        } as CrawlError;
      }
    }
  }
}

export async function crawlDocuments(idsToCrawl: string[], urlsToCrawl: string[], retryConfig: CrawlRetryConfig): Promise<CrawledDocument[]> {
  const crawledDocuments = await Promise.all(
    urlsToCrawl.map((url, i) => crawlSinglePageWithRetry(idsToCrawl[i].toString(), url, retryConfig)));
  const successfullyCrawledDocuments = crawledDocuments.filter((document) => document.id !== undefined) as CrawledDocument[];
  const failedCrawledDocuments = crawledDocuments.filter((document) => document.id === undefined) as CrawlError[];
  failedCrawledDocuments.forEach((document) => {
    console.error(`Failed to crawl ${document.url}: ${document.message}, ${document.stack}`);
  });
  return successfullyCrawledDocuments;
}

export function generateIdsToCrawl(minId: number, maxId: number): string[] {
  const idsToCrawl = Array(maxId - minId + 1).fill(0).map((_, i) => minId + i)
  return idsToCrawl.map((id) => id.toString());
}

export function generateUrlsToCrawl(baseUrl: string, idsToCrawl: string[]): string[] {
  const urlsToCrawl = idsToCrawl.map((id) => `${baseUrl}${id}`);
  return urlsToCrawl;
}

export async function filterIdsToCrawl(ids: string[], websiteId: string, strategy: DuplicateCrawlStrategy): Promise<string[]> {
  const db = admin.firestore();
  // Firestore "in" query has a limit of 30 ids at the same time.
  const idBatchSize = 30;
  const numIdBatches = Math.ceil(ids.length / idBatchSize);
  const idBatches = Array(numIdBatches).fill(0).map((_, i) => {
    const start = i * idBatchSize;
    const end = Math.min((i + 1) * idBatchSize, ids.length);
    return ids.slice(start, end);
  });
  async function getDuplicateIdInBatch(idBatch: string[]): Promise<string[]> {
    const query = db.collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.CrawledDocuments)
      .where("id", "in", idBatch);
    const duplicateIds = await query.get().then((snapshot) => snapshot.docs.map((doc) => doc.id));
    return duplicateIds;
  }
  const duplicateIdBatches = await Promise.all(idBatches.map((idBatch) => getDuplicateIdInBatch(idBatch)));
  const duplicateIds = duplicateIdBatches.flat();
  const duplicateIdSet = new Set(duplicateIds);
  switch (strategy) {
    case DuplicateCrawlStrategy.skip:
      return ids.filter((id) => !duplicateIdSet.has(id));
    case DuplicateCrawlStrategy.overwrite:
      return ids;
    case DuplicateCrawlStrategy.abort:
      return [];
    default:
      throw new Error(`Unknown duplicate crawl strategy: ${strategy}`);
  }
}

export async function writeCrawledDocumentInFireStore(websiteId: string, documents: CrawledDocument[]): Promise<void> {
  const db = admin.firestore();
  const batch = db.batch();
  const crawledAt = (new Date()).toISOString();
  const documentsWithCrawledAt = documents.map((document) => {
    return {
      ...document,
      crawledAt,
    };
  });
  documentsWithCrawledAt.forEach((document) => {
    const ref = db.collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.CrawledDocuments)
      .doc(document.id);
    batch.set(ref, document);
  });
  try {
    await batch.commit();
  } catch (e) {
    throw new Error(`Error while commiting write batch of crawled documents to firestore: ${e}`);
  }
}
export function urlOfCrawledFile(crawledFile: HYSUFile): string {
  return `https://startup.hanyang.ac.kr/api/resource/download/${crawledFile.fileId}`;
}

export function extractTextFromHtml(root: HTMLElement): string {
  const allTextsWithAmp = root.rawText;
  const allTextsWithNbsp = allTextsWithAmp.replace(/&amp;/g, "&");
  const allTexts = allTextsWithNbsp.replace(/&nbsp;/g, " ");
  return allTexts;
}

export function extractImageUrlsFromHtml(root: HTMLElement): string[] {
  const images = root.querySelectorAll("img");
  const allImageUrls = images.map((image) => image.getAttribute("src"));
  const validImageUrls = allImageUrls.filter((url) => url !== null && url !== undefined) as string[];
  const contentImagePrefix = "https://startup.hanyang.ac.kr:443/api/resource/BOARD_CONTENT_IMG";
  const contentImageUrls = validImageUrls.filter((url) => url.startsWith(contentImagePrefix));
  return contentImageUrls;
}
