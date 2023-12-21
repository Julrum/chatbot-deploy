"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawler = void 0;
// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const firebase_functions_1 = require("firebase-functions");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const express = require("express");
const crawl_1 = require("./crawl");
const pulse_1 = require("@orca.ai/pulse");
const config_1 = require("./configs/config");
(0, app_1.initializeApp)();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get("/ping", (req, res) => {
    res.status(200).send({
        message: "pong",
        timestamp: (new Date()).toISOString(),
    });
});
app.post("/crawl", async (req, res) => {
    const crawlConfig = req.body;
    const chromaCollectionId = crawlConfig.collectionName;
    let threads = [];
    try {
        threads = await (0, crawl_1.crawlThreads)(crawlConfig.minId, crawlConfig.maxId, crawlConfig.maxRetry, crawlConfig.maxOCRRetry);
    }
    catch (e) {
        if (e instanceof Error) {
            firebase_functions_1.logger.error(e);
            res.status(500).send({
                message: `Failed to crawl threads. \
      name=${e.name}, message=${e.message}, stack=${e.stack}`,
            });
        }
        else {
            res.status(500).send({
                message: `Failed to crawl threads. ${e}`,
            });
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
        id: `${thread.id}-${thread.type}-${thread.offset}`,
        metadata: {
            title: thread.title,
            date: thread.date,
            url: thread.url,
            imageUrls: JSON.stringify(thread.imageUrls),
        },
        content: thread.content,
    }));
    if (documents.length == 0) {
        const err = `No documents to send to Chroma API. \
    # of threads=${threads.length}, \
    # of splitted threads=${splittedThreads.length}, \
    # of documents=${documents.length}`;
        firebase_functions_1.logger.error(err);
        res.status(500).send({
            message: err,
        });
        return;
    }
    const chromaClient = new pulse_1.ChromaClient(config_1.config.chromaFunctionUrl);
    try {
        firebase_functions_1.logger.debug(`Sending ${documents.length} documents to Chroma API.`);
        await chromaClient.addDocuments(chromaCollectionId, documents);
        // eslint-disable-next-line max-len
        firebase_functions_1.logger.debug(`Successfully sent ${documents.length} documents to Chroma API.`);
        res.status(200).send({
            message: `Successfully sent ${documents.length} documents to Chroma API.`,
        });
    }
    catch (e) {
        if (e instanceof Error) {
            firebase_functions_1.logger.error(`Failed to send documents to Chroma API. \
      name=${e.name}, message=${e.message}, stack=${e.stack}`);
            res.status(500).send({
                message: `Failed to send documents to Chroma API. error=${e}`,
            });
        }
        else {
            firebase_functions_1.logger.error(`Failed to send documents to Chroma API. ${e}`);
            res.status(500).send({
                message: `Failed to send documents to Chroma API. ${e}`,
            });
        }
        return;
    }
});
config_1.config.listen(app);
exports.crawler = (0, https_1.onRequest)(app);
//# sourceMappingURL=index.js.map