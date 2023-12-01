"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChromaCollection = exports.addThreads = exports.splitThreadsByContentLength = void 0;
const chromadb_1 = require("chromadb");
const secret_manager_1 = require("@google-cloud/secret-manager");
const model_1 = require("./model");
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
/**
 * @param {Thread} thread
 * @param {number} maxContentLength
 * @return {Thread[]} splitted notification threads.
 */
function splitThreadByContentLength(thread, maxContentLength) {
    const content = thread.content;
    const splittedContents = [];
    for (let i = 0; i < content.length; i += maxContentLength) {
        const end = Math.min(i + maxContentLength, content.length);
        const splitContent = content.slice(i, end);
        splittedContents.push(splitContent);
    }
    const splittedNotificationThreads = splittedContents.map((v, i) => ({
        id: thread.id,
        date: thread.date,
        offset: i * maxContentLength,
        title: thread.title,
        content: v,
        url: thread.url,
        imageUrls: thread.imageUrls,
    }));
    return splittedNotificationThreads;
}
/**
 * @param {Thread[]} threads
 * @param {number} maxContentLength
 * @return {Thread[]} splitted notification threads.
 */
function splitThreadsByContentLength(threads, maxContentLength) {
    const splittedThreads = [];
    for (const thread of threads) {
        const splittedThreads = splitThreadByContentLength(thread, maxContentLength);
        splittedThreads.push(...splittedThreads);
    }
    return splittedThreads;
}
exports.splitThreadsByContentLength = splitThreadsByContentLength;
/**
 * @param {Collection} collection
 * @param {Thread[]} threads
 */
async function addThreads(collection, threads) {
    if (threads.length === 0) {
        console.log("No new notification threads to add.");
        return;
    }
    if (!collection.embeddingFunction) {
        throw new Error("Collection does not have embedding function.");
    }
    const ids = threads.map((v) => (0, model_1.chromaIdEncode)(v.id, v.offset));
    const embeddings = await collection.embeddingFunction.generate(threads.map((v) => v.content));
    const records = threads.map((v) => ({
        offset: v.offset,
        title: v.title,
        date: v.date,
        url: v.url,
        imageUrls: v.imageUrls,
        content: v.content,
    }));
    const metadatas = records.map((v) => ({
        offset: v.offset,
        title: v.title,
        date: v.date,
        url: v.url,
        content: v.content,
        // Removed imageUrls from metadata becaue Metadata
        // does not support array type.
    }));
    await collection.add({
        ids,
        embeddings,
        metadatas,
    });
}
exports.addThreads = addThreads;
/**
 * @param {ChromaConfig} chromaConfig
 * @return {Promise<Collection>}
 */
async function getChromaCollection(chromaConfig) {
    const openaiAPIKey = await accessOpenAIAPIKey();
    const embeddingFunction = new chromadb_1.OpenAIEmbeddingFunction({
        openai_api_key: openaiAPIKey,
    });
    const client = new chromadb_1.ChromaClient({
        path: `${chromaConfig.host}:${chromaConfig.port}`,
    });
    const collection = await client.getOrCreateCollection({
        name: chromaConfig.collectionName,
        metadata: {
            "description": chromaConfig.collectionDescription,
        },
        embeddingFunction,
    });
    return collection;
}
exports.getChromaCollection = getChromaCollection;
//# sourceMappingURL=vector_db.js.map