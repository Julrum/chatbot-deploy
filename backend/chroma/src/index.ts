import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as express from "express";
import {ChromaClient, Collection, OpenAIEmbeddingFunction} from "chromadb";
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";

const app = express();

/**
 * @return {Promise<string>} openai api key.
 */
async function accessOpenAIAPIKey() : Promise<string> {
  const secretManagerClient = new SecretManagerServiceClient();
  const openaiAPIKeySecret = await secretManagerClient.accessSecretVersion({
    // eslint-disable-next-line max-len
    name: "projects/228958603217/secrets/chatbot-cloud-function-openai/versions/latest",
  });
  const openaiAPIKey = openaiAPIKeySecret[0].payload?.data?.toString();
  if (!openaiAPIKey) {
    throw new Error("Failed to get openai api key from secret manager.");
  }
  return openaiAPIKey;
}

const client = new ChromaClient({path: "http://10.128.0.4:8000"});

app.get("/ping", (req, res) => {
  logger.info("ping");
  res.status(200).send({
    "message": "pong",
    "timestamp": new Date().toISOString(),
  });
});

// POST /collections/1234
app.post("/collections/:collectionId", async (req, res) => {
  const {collectionId} = req.params;
  try {
    const collection: Collection = await client.createCollection({
      name: collectionId,
    });
    res.status(200).send(
      `Created collection ${collection.id}.`);
  } catch (e) {
    res.status(409).send(
      `Collection ${collectionId} already exists.`);
  }
});

// GET /collections/
app.get("/collections", async (req, res) => {
  const collections = await client.listCollections();
  res.status(200).send(collections);
});
// GET /collections/1234
app.get("/collections/:collectionId", async (req, res) => {
  const {collectionId} = req.params;
  try {
    const collection = await client.getCollection({name: collectionId});
    res.status(200).send(collection);
  } catch (e) {
    res.status(404).send(
      `Collection ${collectionId} not found. 
      You should provide "name" of the collection, not "id".`);
  }
});
// DELETE /collections/1234
app.delete("/collections/:collectionId", async (req, res) => {
  const {collectionId} = req.params;
  try {
    await client.deleteCollection({name: collectionId});
    res.status(200).send(`Collection ${collectionId} deleted.`);
  } catch (e) {
    res.status(404)
      .send(`Failed to delete collection with name ${collectionId}.`);
  }
});

type Metadata = Record<string, string | number | boolean>;
interface Document {
  id: string;
  metadata: Metadata;
  content: string;
}

// POST /collections/1234/documents/
app.post("/collections/:collectionId/documents",
  async (req, res) => {
    const {collectionId} = req.params;
    const documents: Document[] = req.body.documents;
    const ids = documents.map((doc) => doc.id);
    const metadatas = documents.map((doc) => doc.metadata);
    const contents = documents.map((doc) => doc.content);

    const openaiAPIKey = await accessOpenAIAPIKey();
    const embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: openaiAPIKey,
    });
    try {
      const collection = await client.getCollection({
        name: collectionId,
        embeddingFunction,
      });
      const results = await collection.add({
        ids: ids,
        metadatas: metadatas,
        documents: contents,
      });
      if (!results) {
        res.status(500).send("Failed to add documents.");
        return;
      }
      res.status(200).send(`Successfully added ${documents.length} documents.`);
    } catch (e) {
      res.status(404).send(`Collection "${collectionId}" not found.`);
    }
  });
// GET /collections/1234/documents/some-doc-id
// TODO: Implement metadata filtering queries.
// e.g. GET documents whose date is after 2021-01-01.
app.get("/collections/:collectionId/documents/:documentId",
  async (req, res) => {
    try {
      const {collectionId, documentId} = req.params;
      const collection = await client.getCollection({name: collectionId});
      const document = await collection.get({ids: [documentId]});
      if (document.ids.length === 0) {
        res.status(404).send(`Document ${documentId} not found.`);
        return;
      }
      res.status(200).send(document);
    } catch (e) {
      res.status(500).send(e);
    }
  });
// DELETE /collections/1234/documents/some-doc-id
app.delete("/collections/:collectionId/documents/:documentId",
  async (req, res) => {
    const {collectionId, documentId} = req.params;
    const collection = await client.getCollection({name: collectionId});
    await collection.delete({ids: [documentId]});
    res.status(200).send(`Document ${documentId} deleted.`);
  });
// GET /collections/1234/count
app.get("/collections/:collectionId/count", async (req, res) => {
  const {collectionId} = req.params;
  try {
    const collection = await client.getCollection({name: collectionId});
    const documentCount = await collection.count();
    logger.info(`Collection ${collectionId} has ${documentCount} documents.`);
    res.status(200).send({
      "collectionId": collectionId,
      "count": documentCount,
    });
  } catch (e) {
    res.status(404).send(`Collection ${collectionId} not found.`);
  }
});

interface Query {
  numResults: number;
  query: string;
}

// POST /collections/1234/query
app.post("/collections/:collectionId/query",
  async (req, res) => {
    const {collectionId} = req.params;
    const openaiAPIKey = await accessOpenAIAPIKey();
    const embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: openaiAPIKey,
    });
    const collection = await client.getCollection({
      name: collectionId,
      embeddingFunction,
    });
    const query: Query = req.body;
    const queryEmbeddings = await embeddingFunction.generate(
      [query.query]);

    const queryResult = await collection.query({
      queryEmbeddings,
      nResults: query.numResults,
    });
    const ids = queryResult.ids;
    const metadatas = queryResult.metadatas;
    const documents = queryResult.documents;
    const results = ids.map((id, i) => ({
      id: id,
      metadata: metadatas[i],
      content: documents[i],
    }));
    res.status(200).send(results);
  }
);
export const chroma = onRequest(app);
