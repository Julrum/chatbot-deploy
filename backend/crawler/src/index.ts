// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
import {logger} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import * as express from "express";
import {crawlThreads} from "./crawl";
import {
  CrawlConfig, Document, Metadata, Thread,
} from "./model";
import {AxiosResponse} from "axios";
import axios from "axios";

initializeApp();
const app = express();
app.use(express.json());
app.use(express.urlencoded( {extended: false} ));
app.post("/crawl", async (req, res) => {
  const crawlConfig: CrawlConfig = req.body;
  // TODO: Fix chromaBaseUrl and chromaCollectionId
  // to be configurable by env vars.
  const chromaBaseUrl = "https://chroma-z5eqvjec2q-uc.a.run.app";
  const chromaCollectionId = crawlConfig.collectionName;

  let threads: Thread[] = [];
  try {
    threads = await crawlThreads({
      maxPage: crawlConfig.maxPage,
      startDate: new Date(crawlConfig.startDate),
      endDate: new Date(crawlConfig.endDate),
    });
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e);
      res.status(500).send(`Failed to crawl threads. \
      name=${e.name}, message=${e.message}, stack=${e.stack}`);
    } else {
      res.status(500).send(`Failed to crawl threads. ${e}`);
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
    id: `${thread.id}-${thread.offset}`,
    metadata: {
      title: thread.title,
      date: thread.date,
      url: thread.url,
      imageUrls: thread.imageUrls.join(","),
    } as Metadata,
    content: thread.content,
  }));
  // logger.debug(`Sending ${documents.length} documents to Chroma API.`);
  // logger.debug(`documents=${JSON.stringify({
  //   documents: documents,
  // })}`);

  // res.status(200).send(`Crawled ${threads.length} threads.`);
  // return;
  if (documents.length == 0) {
    const err = `No documents to send to Chroma API. \
    # of threads=${threads.length}, \
    # of splitted threads=${splittedThreads.length}, \
    # of documents=${documents.length}`;
    logger.error(err);
    res.status(500).send(err);
    return;
  }

  logger.debug(
    `POST ${chromaBaseUrl}/collections/${chromaCollectionId}/documents`);

  let chromaRes: AxiosResponse;
  try {
    chromaRes = await axios.post(
      `${chromaBaseUrl}/collections/${chromaCollectionId}/documents`,
      {
        documents: documents,
      },
    );
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e);
      res.status(500).send(`Failed to send documents to Chroma API. \
      name=${e.name}, message=${e.message}, stack=${e.stack}`);
    } else {
      logger.error(`Failed to send documents to Chroma API. ${e}`);
      res.status(500).send(`Failed to send documents to Chroma API. ${e}`);
    }
    return;
  }

  logger.debug(`Chroma API response: ${chromaRes.status}`);

  switch (chromaRes.status) {
  case 200:
    logger.info(`Successfully crawled ${threads.length} threads.`);
    res.status(200).send(`Successfully crawled ${threads.length} threads.`);
    break;
  default:
    logger.error(`Failed to crawl threads, Chroma API returned \
      status=${chromaRes.status}`);
    res.status(500).send(`Failed to crawl threads. Chroma API ended with \
      status=${chromaRes.status}`);
    // logger.error(`Failed to crawl threads. \
    //   status=${chromaRes.status}, data=${chromaRes.data}`);
    // res.status(500).send(`Failed to crawl threads. Chroma API ended with \
    //   status=${chromaRes.status}, data=${chromaRes.data}`);
    return;
  }
});

// Only for local testing.
app.listen(8080, () => {
  logger.info("Crawler started listening on port 8080.");
}
);

export const crawler = onRequest(app);
