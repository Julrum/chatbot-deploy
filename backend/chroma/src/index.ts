import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as express from "express";
import {
  ChromaClient, Collection,
  IncludeEnum, OpenAIEmbeddingFunction,
} from "chromadb";
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
import {config} from "./configs/config";
import {
  Document, Query, QueryResult,
  StringMessage, GetResult, CountResult, PingResponse} from "@orca.ai/pulse";


const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());
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

const client = new ChromaClient({path: config.chromaHost});
// const client = new ChromaClient({path: "localhost:8000"});

app.get("/ping", (req, res) => {
  logger.info("ping");
  res.status(200).send({
    "message": "pong",
    "timestamp": new Date().toISOString(),
  } as PingResponse);
});

// POST /collections/1234
app.post("/collections/:collectionId", async (req, res) => {
  const {collectionId} = req.params;
  try {
    const collection: Collection = await client.createCollection({
      name: collectionId,
    });
    res.status(200).send(collection);
  } catch (e) {
    res.status(409).send({
      message: `Collection ${collectionId} already exists.`,
    } as StringMessage);
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
    res.status(404).send({
      message: `Collection ${collectionId} not found. \
      You should provide "name" of the collection, not "id".`,
    } as StringMessage);
  }
});
// DELETE /collections/1234
app.delete("/collections/:collectionId", async (req, res) => {
  const {collectionId} = req.params;
  try {
    await client.deleteCollection({name: collectionId});
    res.status(200).send({
      message: `Collection ${collectionId} deleted.`,
    } as StringMessage);
  } catch (e) {
    res.status(404).send({
      message: `Failed to delete collection with name ${collectionId}.`,
    } as StringMessage);
  }
});

// POST /collections/1234/documents/
app.post("/collections/:collectionId/documents",
  async (req, res) => {
    logger.debug("POST /collections/:collectionId/documents called.");
    const {collectionId} = req.params;
    if (req.body === undefined) {
      console.error(`Request body not provided, got ${JSON.stringify(req)}`);
      res.status(400).send({
        message: "Request body not provided.",
      } as StringMessage);
      return;
    }
    const documents: Document[] = req.body.documents;
    if (!documents) {
      res.status(400).send({
        message: "Documents not provided.",
      } as StringMessage);
      return;
    }
    const ids = documents.map((doc) => doc.id);
    const metadatas = documents.map((doc) => doc.metadata);
    const contents = documents.map((doc) => doc.content);

    let openaiAPIKey: string;
    try {
      openaiAPIKey = await accessOpenAIAPIKey();
    } catch (e) {
      res.status(500).send({
        message: "Failed to access openai api key.",
      } as StringMessage);
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
      res.status(404).send({
        message: `Collection "${collectionId}" not found.`,
      } as StringMessage);
      return;
    }
    try {
      if (ids.length == 0) {
        res.status(400).send({
          message: "At least one document should be provided, got 0.",
        } as StringMessage);
        return;
      }
      if (ids.length != metadatas.length || ids.length != contents.length) {
        res.status(500).send({
          // eslint-disable-next-line max-len
          message: `length of ids(${ids.length}), metadatas(${metadatas.length}), contents(${contents.length}) should be the same.`,
        } as StringMessage);
        return;
      }
      let embeddings: number[][];
      try {
        embeddings = await embeddingFunction.generate(contents);
      } catch (e) {
        logger.error(`Failed to generate embeddings: ${e}`);
        res.status(500).send({
          message: `Failed to generate embeddings: ${e}`,
        } as StringMessage);
        return;
      }
      const results = await collection.add({
        ids: ids,
        metadatas: metadatas,
        documents: contents,
        embeddings: embeddings,
      });
      if (!results) {
        res.status(500).send({
          message: "Failed to add documents.",
        } as StringMessage);
        return;
      }
      res.status(200).send({
        message: `Successfully added ${documents.length} documents.`,
      } as StringMessage);
    } catch (e) {
      logger.error(`Failed to add documents: ${e}`);
      res.status(500).send({
        message: `Failed to add documents: ${e}`,
      } as StringMessage);
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
        const allDocs = await collection.peek({limit: 99999});
        console.error(`Dump of all IDs: ${allDocs.ids}`);
        // eslint-disable-next-line max-len
        console.error(`Document ${documentId} not found, got ${JSON.stringify(document)}`);
        res.status(404).send({
          message: `Document ${documentId} not found.`,
        } as StringMessage);
        return;
      }
      res.status(200).send(document as GetResult);
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
    res.status(200).send({
      message: `Document ${documentId} deleted.`,
    } as StringMessage);
  });
// GET /collections/1234/count
app.get("/collections/:collectionId/count", async (req, res) => {
  const {collectionId} = req.params;
  try {
    const collection = await client.getCollection({name: collectionId});
    const documentCount = await collection.count();
    logger.info(`Collection ${collectionId} has ${documentCount} documents.`);
    res.status(200).send({
      collectionId: collectionId,
      count: documentCount,
    } as CountResult);
  } catch (e) {
    res.status(404).send({
      message: `Collection ${collectionId} not found.`,
    } as StringMessage);
  }
});

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
      res.status(400).send({
        message: "Query not provided.",
      } as StringMessage);
      return;
    }
    const maxDistance: number = req.body.maxDistance;
    if (!maxDistance) {
      res.status(400).send({
        message: "maxDistance not provided.",
      } as StringMessage);
      return;
    }
    const minContentLength: number = req.body.minContentLength;
    if (!minContentLength) {
      res.status(400).send({
        message: "minContentLength not provided.",
      } as StringMessage);
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
        const distances = result.distances ?? [];
        const contents = result.contents ?? [];
        const metadatas = result.metadatas ?? [];

        const validIndicies = result.ids.map((id, i) => {
          const distance = distances[i] ?? Infinity;
          const content = contents[i] ?? "";
          return distance <= maxDistance && content.length >= minContentLength;
        });
        const filteredIds = result.ids.filter((_, i) => validIndicies[i]);
        const filteredMetadata = metadatas.filter(
          (_, i) => validIndicies[i]);
        const filteredContent = contents.filter(
          (_, i) => validIndicies[i]);
        const filteredDistances = distances.filter(
          (_, i) => validIndicies[i]);
        const deduplicatedIds = [...new Set(filteredIds)];
        const deduplicatedMetadata = deduplicatedIds.map((id) => {
          const index = filteredIds.indexOf(id);
          return filteredMetadata[index];
        }
        );
        const deduplicatedContent = deduplicatedIds.map((id) => {
          const index = filteredIds.indexOf(id);
          return filteredContent[index];
        }
        );
        const deduplicatedDistances = deduplicatedIds.map((id) => {
          const index = filteredIds.indexOf(id);
          return filteredDistances[index];
        }
        );
        return {
          ids: deduplicatedIds,
          metadatas: deduplicatedMetadata,
          contents: deduplicatedContent,
          distances: deduplicatedDistances,
        } as QueryResult;
      };
      const filteredQueryResults = results.map(filterQueryResult);
      res.status(200).send(filteredQueryResults);
    } catch (e) {
      res.status(500).send({
        message: `Failed to query: ${e}`,
      } as StringMessage);
    }
  }
);

config.listen(app);
export const chroma = onRequest(app);
