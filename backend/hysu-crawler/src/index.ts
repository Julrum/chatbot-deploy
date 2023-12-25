import {logger} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import express from "express";
import { PingResponse, HttpError, StringMessage, CrawlRequest, CrawledDocument } from "@orca.ai/pulse";
import { 
  crawlDocuments, 
  filterIdsToCrawl, 
  generateIdsToCrawl, 
  generateUrlsToCrawl, 
  writeCrawledDocumentInFireStore,
} from "./crawl";
import { getDriver } from "./driver";
import { validateCrawlRequest } from "./type-utils";

const app = express();

app.use(express.json());
app.use(express.urlencoded( {extended: false} ));

app.get("/ping", (_, res) => {
  res.status(200).send({
    message: "pong",
    timestamp: (new Date()).toISOString(),
  } as PingResponse);
});

app.post("/crawl", async (req, res) => {
  const crawlRequest = req.body as CrawlRequest;
  try {
    validateCrawlRequest(crawlRequest);
  } catch (e) {
    const he = e as HttpError;
    res.status(he.statusCode).send({
      message: `Bad Request, ${he.message}, \nStacktrace: ${he.stack}`,
    } as StringMessage);
    return;
  }
  logger.info(`Crawl request received: ${JSON.stringify(crawlRequest)}`);
  const baseUrl = "https://startup.hanyang.ac.kr/api/board/content/";
  const requestedIdsToCrawl = generateIdsToCrawl(crawlRequest.minId, crawlRequest.maxId);
  const idsToCrawl = await filterIdsToCrawl(
    requestedIdsToCrawl, crawlRequest.websiteId, crawlRequest.duplicateCrawlStrategy);
  logger.info(`Filtered ${requestedIdsToCrawl.length} ids to crawl to ${idsToCrawl.length} ids`);
  const urlsToCrawl = generateUrlsToCrawl(baseUrl, idsToCrawl);
  logger.info(`Start crawling ${urlsToCrawl.length} pages`);
  let crawledDocuments: CrawledDocument[] = [];
  try {
    crawledDocuments = await crawlDocuments(idsToCrawl, urlsToCrawl, crawlRequest.retryConfig);
  } catch (e) {
    const error = e as Error;
    res.status(500).send({
      message: `Internal Server Error, ${error.message}, \nStacktrace: ${error.stack}`,
    } as StringMessage);
    return;
  }
  logger.info(`Crawled ${crawledDocuments.length} documents, writing to firestore, websiteId: ${crawlRequest.websiteId}`);
  try {
    await writeCrawledDocumentInFireStore(crawlRequest.websiteId, crawledDocuments);
  } catch (e) {
    const error = e as Error;
    res.status(500).send({
      message: `Internal Server Error, ${error.message}, \nStacktrace: ${error.stack}`,
    } as StringMessage);
    return;
  }
  logger.info(`Successfully wrote ${crawledDocuments.length} documents to firestore`);
  res.status(200).send({
    message: `Successfully crawled ${crawledDocuments.length} documents`,
  } as StringMessage);
});

app.use((req, res) => {
  res.status(404).send({
    message: `Route ${req.url} not found. Maybe you forgot to add resource paths?`,
  } as StringMessage);
});

getDriver().listen(app);
export const hysuCrawler = onRequest(app);

