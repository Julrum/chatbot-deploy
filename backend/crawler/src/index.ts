// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
import {logger} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import * as express from "express";
import {crawlThreads} from "./crawl";
import {
  splitThreadsByContentLength,
} from "./thread_util";
import {
  CrawlConfig, Document, Metadata,
} from "./model";
import axios from "axios";

initializeApp();
const app = express();
app.post("/", (req, res) => {
  logger.info("Hello logs!", {structuredData: true});
  res.send("Hello from Firebase!");
});
app.post("/crawl", async (req, res) => {
  const crawlConfig: CrawlConfig = req.body;
  const chromaBaseUrl = "https://chroma-z5eqvjec2q-uc.a.run.app";
  const chromaCollectionId = "chroma-api-test";
  const threads = await crawlThreads({
    maxPage: crawlConfig.maxPage,
    maxRetry: crawlConfig.maxRetry,
    startDate: new Date(crawlConfig.startDate),
    endDate: new Date(crawlConfig.endDate),
  });
  const splittedThreads = splitThreadsByContentLength(
    threads,
    crawlConfig.maxContentLength,
  );
  const documents: Document[] = splittedThreads.map((thread) => ({
    id: `${thread.id}-${thread.offset}`,
    metadata: {
      title: thread.title,
      date: thread.date,
      url: thread.url,
      imageUrls: thread.imageUrls.join(","),
    } as Metadata,
    content: thread.content,
  }));
  const chromaRes = await axios.post(
    `${chromaBaseUrl}/collections/${chromaCollectionId}/documents`,
    {
      documents: documents,
    },
  );
  if (chromaRes.status !== 200) {
    res.status(500).send(
      `Failed to crawl threads. ${chromaRes.data}`,
    );
    return;
  }
  res.status(200).send(`Successfully crawled ${threads.length} threads.`);
});
export const crawler = onRequest(app);
