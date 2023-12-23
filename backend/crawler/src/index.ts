// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
import {logger} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import * as express from "express";
import {crawlThreads} from "./crawl";
import {Thread} from "./model";
import {
  Document, Metadata, ChromaClient, CrawlConfig,
  PingResponse, StringMessage,
} from "@orca.ai/pulse";
import {config} from "./configs/config";

initializeApp();
const app = express();

app.use(express.json());
app.use(express.urlencoded( {extended: false} ));

app.get("/ping", (req, res) => {
  res.status(200).send({
    message: "pong",
    timestamp: (new Date()).toISOString(),
  } as PingResponse);
});

app.post("/crawl", async (req, res) => {
  const crawlConfig: CrawlConfig = req.body;
  const chromaCollectionId = crawlConfig.collectionName;

  let threads: Thread[] = [];
  try {
    threads = await crawlThreads(
      crawlConfig.minId,
      crawlConfig.maxId,
      crawlConfig.maxRetry,
      crawlConfig.maxOCRRetry,
    );
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e);
      res.status(500).send({
        message: `Failed to crawl threads. \
      name=${e.name}, message=${e.message}, stack=${e.stack}`,
      } as StringMessage);
    } else {
      res.status(500).send({
        message: `Failed to crawl threads. ${e}`,
      } as StringMessage);
    }
  }

  const splittedThreads: Thread[] = [];
  for (const thread of threads) {
    for (let i = 0;
      i < thread.content.length;
      i += crawlConfig.maxContentLength) {
      const splittedThread = {
        ...thread,
        offset: i,
        content: thread.content.slice(i, i + crawlConfig.maxContentLength),
      };
      splittedThreads.push(splittedThread);
    }
  }

  logger.debug(`Splitted ${threads.length} threads into \
    ${splittedThreads.length} threads.`);
  const documents: Document[] = splittedThreads.map((thread) => ({
    id: `${thread.id}-${thread.type}-${thread.offset}`,
    metadata: {
      title: thread.title,
      date: thread.date,
      url: thread.url,
      imageUrls: JSON.stringify(thread.imageUrls),
    } as Metadata,
    content: thread.content,
  } as Document));
  if (documents.length == 0) {
    const err = `No documents to send to Chroma API. \
    # of threads=${threads.length}, \
    # of splitted threads=${splittedThreads.length}, \
    # of documents=${documents.length}`;
    logger.error(err);
    res.status(500).send({
      message: err,
    } as StringMessage);
    return;
  }

  const chromaClient = new ChromaClient(config.chromaFunctionUrl);
  try {
    logger.debug(`Sending ${documents.length} documents to Chroma API.`);
    await chromaClient.addDocuments(chromaCollectionId, documents);
    // eslint-disable-next-line max-len
    logger.debug(`Successfully sent ${documents.length} documents to Chroma API.`);
    res.status(200).send({
      message: `Successfully sent ${documents.length} documents to Chroma API.`,
    } as StringMessage);
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Failed to send documents to Chroma API. \
      name=${e.name}, message=${e.message}, stack=${e.stack}`);
      res.status(500).send({
        message: `Failed to send documents to Chroma API. error=${e}`,
      } as StringMessage);
    } else {
      logger.error(`Failed to send documents to Chroma API. ${e}`);
      res.status(500).send({
        message: `Failed to send documents to Chroma API. ${e}`,
      } as StringMessage);
    }
    return;
  }
});

app.use((req, res) => {
  res.status(404).send({
    // eslint-disable-next-line max-len
    message: `Route ${req.url} not found. Maybe you forgot to add resource paths?`,
  } as StringMessage);
});

config.listen(app);
export const crawler = onRequest(app);
