"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawler = void 0;
// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const firebase_functions_1 = require("firebase-functions");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const express = require("express");
const crawl_1 = require("./crawl");
const axios_1 = require("axios");
(0, app_1.initializeApp)();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.post("/crawl", async (req, res) => {
    const crawlConfig = req.body;
    // TODO: Fix chromaBaseUrl and chromaCollectionId
    // to be configurable by env vars.
    const chromaBaseUrl = "https://chroma-z5eqvjec2q-uc.a.run.app";
    const chromaCollectionId = crawlConfig.collectionName;
    let threads = [];
    try {
        threads = await (0, crawl_1.crawlThreads)({
            maxPage: crawlConfig.maxPage,
            startDate: new Date(crawlConfig.startDate),
            endDate: new Date(crawlConfig.endDate),
        });
    }
    catch (e) {
        if (e instanceof Error) {
            firebase_functions_1.logger.error(e);
            res.status(500).send(`Failed to crawl threads. \
      name=${e.name}, message=${e.message}, stack=${e.stack}`);
        }
        else {
            res.status(500).send(`Failed to crawl threads. ${e}`);
        }
    }
    const splittedThreads = [];
    for (const thread of threads) {
        for (let i = 0; i < thread.content.length; i += crawlConfig.maxContentLength) {
            const splittedThread = Object.assign(Object.assign({}, thread), { offset: i, content: thread.content.slice(i, i + crawlConfig.maxContentLength) });
            splittedThreads.push(splittedThread);
        }
    }
    firebase_functions_1.logger.debug(`Splitted ${threads.length} threads into \
    ${splittedThreads.length} threads.`);
    const documents = splittedThreads.map((thread) => ({
        id: `${thread.id}-${thread.offset}`,
        metadata: {
            title: thread.title,
            date: thread.date,
            url: thread.url,
            imageUrls: thread.imageUrls.join(","),
        },
        content: thread.content,
    }));
    firebase_functions_1.logger.debug(`Sending ${documents.length} documents to Chroma API.`);
    firebase_functions_1.logger.debug(`documents=${JSON.stringify({
        documents: documents,
    })}`);
    firebase_functions_1.logger.debug(`POST ${chromaBaseUrl}/collections/${chromaCollectionId}/documents`);
    const chromaRes = await axios_1.default.post(`${chromaBaseUrl}/collections/${chromaCollectionId}/documents`, {
        documents: documents,
    });
    firebase_functions_1.logger.debug(`Chroma API response: ${chromaRes.status}`);
    switch (chromaRes.status) {
        case 200:
            firebase_functions_1.logger.info(`Successfully crawled ${threads.length} threads.`);
            res.status(200).send(`Successfully crawled ${threads.length} threads.`);
            break;
        default:
            firebase_functions_1.logger.error(`Failed to crawl threads, Chroma API returned \
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
// app.listen(8080, () => {
//   logger.info("Crawler started listening on port 8080.");
// }
// );
exports.crawler = (0, https_1.onRequest)(app);
//# sourceMappingURL=index.js.map