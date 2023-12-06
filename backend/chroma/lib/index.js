"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chroma = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const chromadb_1 = require("chromadb");
const secret_manager_1 = require("@google-cloud/secret-manager");
const app = express();
/**
 * @return {Promise<string>} openai api key.
 */
async function accessOpenAIAPIKey() {
    var _a, _b;
    const secretManagerClient = new secret_manager_1.SecretManagerServiceClient();
    const openaiAPIKeySecret = await secretManagerClient.accessSecretVersion({
        // eslint-disable-next-line max-len
        name: "projects/228958603217/secrets/chatbot-cloud-function-openai/versions/latest",
    });
    const openaiAPIKey = (_b = (_a = openaiAPIKeySecret[0].payload) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.toString();
    if (!openaiAPIKey) {
        throw new Error("Failed to get openai api key from secret manager.");
    }
    return openaiAPIKey;
}
const client = new chromadb_1.ChromaClient({ path: "http://10.128.0.4:8000" });
// const client = new ChromaClient({path: "localhost:8000"});
app.get("/ping", (req, res) => {
    logger.info("ping");
    res.status(200).send({
        "message": "pong",
        "timestamp": new Date().toISOString(),
    });
});
// POST /collections/1234
app.post("/collections/:collectionId", async (req, res) => {
    const { collectionId } = req.params;
    try {
        const collection = await client.createCollection({
            name: collectionId,
        });
        res.status(200).send(`Created collection ${collection.id}.`);
    }
    catch (e) {
        res.status(409).send(`Collection ${collectionId} already exists.`);
    }
});
// GET /collections/
app.get("/collections", async (req, res) => {
    const collections = await client.listCollections();
    res.status(200).send(collections);
});
// GET /collections/1234
app.get("/collections/:collectionId", async (req, res) => {
    const { collectionId } = req.params;
    try {
        const collection = await client.getCollection({ name: collectionId });
        res.status(200).send(collection);
    }
    catch (e) {
        res.status(404).send(`Collection ${collectionId} not found. 
      You should provide "name" of the collection, not "id".`);
    }
});
// DELETE /collections/1234
app.delete("/collections/:collectionId", async (req, res) => {
    const { collectionId } = req.params;
    try {
        await client.deleteCollection({ name: collectionId });
        res.status(200).send(`Collection ${collectionId} deleted.`);
    }
    catch (e) {
        res.status(404)
            .send(`Failed to delete collection with name ${collectionId}.`);
    }
});
// POST /collections/1234/documents/
app.post("/collections/:collectionId/documents", async (req, res) => {
    logger.debug("POST /collections/:collectionId/documents called.");
    const { collectionId } = req.params;
    const documents = req.body.documents;
    if (!documents) {
        res.status(400).send("Documents not provided.");
        return;
    }
    const ids = documents.map((doc) => doc.id);
    const metadatas = documents.map((doc) => doc.metadata);
    const contents = documents.map((doc) => doc.content);
    let openaiAPIKey;
    try {
        openaiAPIKey = await accessOpenAIAPIKey();
    }
    catch (e) {
        res.status(500).send("Failed to access openai api key.");
        return;
    }
    const embeddingFunction = new chromadb_1.OpenAIEmbeddingFunction({
        openai_api_key: openaiAPIKey,
    });
    let collection;
    try {
        collection = await client.getCollection({
            name: collectionId,
            // embeddingFunction,
        });
    }
    catch (e) {
        logger.error(`Failed to get collection: ${e}`);
        res.status(404).send(`Collection "${collectionId}" not found.`);
        return;
    }
    try {
        if (ids.length == 0) {
            res.status(400)
                .send("At least one document should be provided, got 0.");
            return;
        }
        if (ids.length != metadatas.length || ids.length != contents.length) {
            res.status(500).send(`\
        length of ids(${ids.length}), \
        metadatas(${metadatas.length}), \
        contents(${contents.length}) \
        should be the same.`);
            return;
        }
        let embeddings;
        try {
            embeddings = await embeddingFunction.generate(contents);
        }
        catch (e) {
            logger.error(`Failed to generate embeddings: ${e}`);
            res.status(500).send(`Failed to generate embeddings: ${e}`);
            return;
        }
        const results = await collection.add({
            ids: ids,
            metadatas: metadatas,
            documents: contents,
            embeddings: embeddings,
        });
        if (!results) {
            res.status(500).send("Failed to add documents.");
            return;
        }
        res.status(200).send(`Successfully added ${documents.length} documents.`);
    }
    catch (e) {
        logger.error(`Failed to add documents: ${e}`);
        res.status(500).send(`Failed to add documents: ${e}`);
    }
});
// GET /collections/1234/documents/some-doc-id
// TODO: Implement metadata filtering queries.
// e.g. GET documents whose date is after 2021-01-01.
app.get("/collections/:collectionId/documents/:documentId", async (req, res) => {
    try {
        const { collectionId, documentId } = req.params;
        const collection = await client.getCollection({ name: collectionId });
        const document = await collection.get({ ids: [documentId] });
        if (document.ids.length === 0) {
            res.status(404).send(`Document ${documentId} not found.`);
            return;
        }
        res.status(200).send(document);
    }
    catch (e) {
        res.status(500).send(e);
    }
});
// DELETE /collections/1234/documents/some-doc-id
app.delete("/collections/:collectionId/documents/:documentId", async (req, res) => {
    const { collectionId, documentId } = req.params;
    const collection = await client.getCollection({ name: collectionId });
    await collection.delete({ ids: [documentId] });
    res.status(200).send(`Document ${documentId} deleted.`);
});
// GET /collections/1234/count
app.get("/collections/:collectionId/count", async (req, res) => {
    const { collectionId } = req.params;
    try {
        const collection = await client.getCollection({ name: collectionId });
        const documentCount = await collection.count();
        logger.info(`Collection ${collectionId} has ${documentCount} documents.`);
        res.status(200).send({
            "collectionId": collectionId,
            "count": documentCount,
        });
    }
    catch (e) {
        res.status(404).send(`Collection ${collectionId} not found.`);
    }
});
// POST /collections/1234/query
app.post("/collections/:collectionId/query", async (req, res) => {
    var _a;
    const { collectionId } = req.params;
    const openaiAPIKey = await accessOpenAIAPIKey();
    const embeddingFunction = new chromadb_1.OpenAIEmbeddingFunction({
        openai_api_key: openaiAPIKey,
    });
    const collection = await client.getCollection({
        name: collectionId,
        embeddingFunction,
    });
    const query = req.body.query;
    if (!query) {
        res.status(400).send("Query not provided.");
        return;
    }
    const maxDistance = req.body.maxDistance;
    if (!maxDistance) {
        res.status(400).send("maxDistance not provided.");
        return;
    }
    const minContentLength = req.body.minContentLength;
    if (!minContentLength) {
        res.status(400).send("minContentLength not provided.");
        return;
    }
    const queryEmbeddings = await embeddingFunction.generate(query.queries);
    try {
        const queryResult = await collection.query({
            queryEmbeddings,
            nResults: query.numResults,
            include: [
                chromadb_1.IncludeEnum.Distances,
                chromadb_1.IncludeEnum.Metadatas,
                chromadb_1.IncludeEnum.Documents,
            ],
        });
        const ids = queryResult.ids;
        const distances = (_a = queryResult.distances) !== null && _a !== void 0 ? _a : Array(ids.length).fill(null);
        const results = ids.map((ids, i) => ({
            ids,
            metadatas: queryResult.metadatas[i],
            contents: queryResult.documents[i],
            distances: distances[i],
        }));
        const filterQueryResult = (result) => {
            const validIndicies = result.ids.map((id, i) => {
                var _a, _b;
                const distance = (_a = result.distances[i]) !== null && _a !== void 0 ? _a : Infinity;
                const content = (_b = result.contents[i]) !== null && _b !== void 0 ? _b : "";
                return distance <= maxDistance && content.length >= minContentLength;
            });
            const filteredIds = result.ids.filter((_, i) => validIndicies[i]);
            const filteredMetadata = result.metadatas.filter((_, i) => validIndicies[i]);
            const filteredContent = result.contents.filter((_, i) => validIndicies[i]);
            const filteredDistances = result.distances.filter((_, i) => validIndicies[i]);
            const deduplicatedIds = [...new Set(filteredIds)];
            const deduplicatedMetadata = deduplicatedIds.map((id) => {
                const index = filteredIds.indexOf(id);
                return filteredMetadata[index];
            });
            const deduplicatedContent = deduplicatedIds.map((id) => {
                const index = filteredIds.indexOf(id);
                return filteredContent[index];
            });
            const deduplicatedDistances = deduplicatedIds.map((id) => {
                const index = filteredIds.indexOf(id);
                return filteredDistances[index];
            });
            return {
                ids: deduplicatedIds,
                metadatas: deduplicatedMetadata,
                contents: deduplicatedContent,
                distances: deduplicatedDistances,
            };
        };
        const filteredQueryResults = results.map(filterQueryResult);
        res.status(200).send(filteredQueryResults);
    }
    catch (e) {
        res.status(500).send(`Failed to query: ${e}`);
    }
});
// app.listen(8080, () => {
//   logger.info("Listening on port 8080.");
// });
exports.chroma = (0, https_1.onRequest)(app);
//# sourceMappingURL=index.js.map