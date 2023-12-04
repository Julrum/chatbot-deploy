import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as express from "express";
import {
  ChromaClient, Collection,
  IncludeEnum, OpenAIEmbeddingFunction,
} from "chromadb";
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

interface QueryResult {
  ids: string[];
  metadatas: (Metadata | null)[];
  contents: (string | null)[];
  distances: (number | null)[];
}

// POST /collections/1234/documents/
app.post("/collections/:collectionId/documents",
  async (req, res) => {
    logger.debug("POST /collections/:collectionId/documents called.");
    const {collectionId} = req.params;
    const documents: Document[] = req.body.documents;
    if (!documents) {
      res.status(400).send("Documents not provided.");
      return;
    }
    const ids = documents.map((doc) => doc.id);
    const metadatas = documents.map((doc) => doc.metadata);
    const contents = documents.map((doc) => doc.content);

    let openaiAPIKey: string;
    try {
      openaiAPIKey = await accessOpenAIAPIKey();
    } catch (e) {
      res.status(500).send("Failed to access openai api key.");
      return;
    }
    const embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: openaiAPIKey,
    });
    let collection: Collection;
    try {
      collection = await client.getCollection({
        name: collectionId,
        // embeddingFunction,
      });
    } catch (e) {
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
      let embeddings: number[][];
      try {
        embeddings = await embeddingFunction.generate(contents);
      } catch (e) {
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
    } catch (e) {
      logger.error(`Failed to add documents: ${e}`);
      res.status(500).send(`Failed to add documents: ${e}`);
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
  queries: string[];
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
    const query: Query = req.body.query;
    if (!query) {
      res.status(400).send("Query not provided.");
      return;
    }
    const maxDistance: number = req.body.maxDistance;
    if (!maxDistance) {
      res.status(400).send("maxDistance not provided.");
      return;
    }
    const minContentLength: number = req.body.minContentLength;
    if (!minContentLength) {
      res.status(400).send("minContentLength not provided.");
      return;
    }

    const queryEmbeddings = await embeddingFunction.generate(
      query.queries);

    try {
      const queryResult = await collection.query({
        queryEmbeddings,
        nResults: query.numResults,
        include: [
          IncludeEnum.Distances,
          IncludeEnum.Metadatas,
          IncludeEnum.Documents,
        ],
      });
      const ids = queryResult.ids;
      const distances = queryResult.distances ?? Array(ids.length).fill(null);
      const results = ids.map((ids, i) => ({
        ids,
        metadatas: queryResult.metadatas[i],
        contents: queryResult.documents[i],
        distances: distances[i],
      } as QueryResult));
      const filterQueryResult = (result: QueryResult) => {
        const validIndicies = result.ids.map((id, i) => {
          const distance = result.distances[i] ?? Infinity;
          const content = result.contents[i] ?? "";
          return distance <= maxDistance && content.length >= minContentLength;
        });
        const filteredIds = result.ids.filter((_, i) => validIndicies[i]);
        const filteredMetadata = result.metadatas.filter(
          (_, i) => validIndicies[i]);
        const filteredContent = result.contents.filter(
          (_, i) => validIndicies[i]);
        const filteredDistances = result.distances.filter(
          (_, i) => validIndicies[i]);
        const filteredQueryResult = {
          ids: filteredIds,
          metadatas: filteredMetadata,
          contents: filteredContent,
          distances: filteredDistances,
        } as QueryResult;
        return filteredQueryResult;
      };
      const filteredQueryResults = results.map(filterQueryResult);
      res.status(200).send(filteredQueryResults);
    } catch (e) {
      res.status(500).send(`Failed to query: ${e}`);
    }
  }
);

// app.listen(8080, () => {
//   logger.info("Listening on port 8080.");
// });
export const chroma = onRequest(app);
