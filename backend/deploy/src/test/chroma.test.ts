import { ChromaClient, Collection, Document } from "@orca.ai/pulse";
import { getFunctionURLFromEnv } from "./common";
import { FunctionName } from "../deploy/gcf";


export async function cleanDB(client: ChromaClient) {
  const collections = await client.listCollections();
  await Promise.all(collections.map(async collection => {
    await client.deleteCollection(collection.name);
  }));
  const leftCollections = await client.listCollections();
  expect(leftCollections.length).toBe(0);
}

export let client: ChromaClient;
let testCollection: Collection;
beforeEach(async () => {
  const functionURL = getFunctionURLFromEnv(FunctionName.chroma);
  console.debug(`chromaURL: ${functionURL}`)
  client = new ChromaClient(functionURL);
  await cleanDB(client);
});
afterEach(async () => {
  if (testCollection === undefined) {
    return;
  }
  await client.deleteCollection(testCollection.name);
});

describe('Chroma Document CRUD', () => {
  it('Create and delete a document', async () => {
    const testCollectionName = `test-collection-${(new Date()).getTime()}`;
    testCollection = await client.createCollection(testCollectionName);
    const initialDocuments = await client.countDocumentsInCollection(testCollection.name);
    expect(initialDocuments).toBe(0);

    const numberOfDocuments = 5;
    const documentIds = Array.from(
      Array(numberOfDocuments), () => crypto.randomUUID());
    const documents: Document[] = documentIds.map((id) => ({
      id,
      metadata: {},  
      content: `test content for ${id}`,
    }));
    await client.addDocuments(testCollection.name, documents);
    const documentsInCollection = await client.countDocumentsInCollection(testCollection.name);
    expect(documentsInCollection).toBe(numberOfDocuments);
    const firstDocument = await client.getDocument(testCollection.name, documentIds[0]);
    expect(firstDocument).toStrictEqual(documents[0]);

    await client.deleteDocument(testCollection.name, documentIds[0]);
    const leftDocuments = await client.countDocumentsInCollection(testCollection.name);
    expect(leftDocuments).toBe(numberOfDocuments - 1);

    expect(client.getDocument(testCollection.name, documentIds[0])).rejects.toThrow();

    await Promise.all(documentIds.map(async id => {
      await client.deleteDocument(testCollection.name, id);
    }));
    const finalLeftDocuments = await client.countDocumentsInCollection(testCollection.name);
    expect(finalLeftDocuments).toBe(0);
  },
  10000);
});

describe('Chroma Collection CRUD', () => {
  it('Create and delete a collection', async () => {
    const initialCollections = await client.listCollections();
    expect(initialCollections.length).toBe(0);

    const newCollection = await client.createCollection(testCollection.name);
    expect(newCollection.name).toBe(testCollection.name);

    const collections = await client.listCollections();
    expect(collections.length).toBe(1);

    const collection = await client.getCollection(testCollection.name);
    expect(collection.name).toBe(testCollection.name);

    await client.deleteCollection(testCollection.name);
    const leftCollections = await client.listCollections();
    expect(leftCollections.length).toBe(0);
  }, 10000);
});

describe('Multiple Collection CRUD', () => {
  it('Create and delete multiple collections', async () => {
    const initialCollections = await client.listCollections();
    expect(initialCollections.length).toBe(0);

    const names = [];
    const numCollections = 10;
    for (let i = 0; i < numCollections; i++) {
      names.push(`${testCollection.name}-${i}`);
      await client.createCollection(names[i]);
    }
    const newCollections = await client.listCollections();
    const sortedNames = names.sort();
    const sortedFoundNames = newCollections.map(collection => collection.name).sort();
    expect(newCollections.length).toBe(numCollections);
    for (let i = 0; i < numCollections; i++) {
      expect(sortedFoundNames[i]).toBe(sortedNames[i]);
    }
    await Promise.all(names.map(async name => {
      await client.deleteCollection(name);
    }));
    const finalLeftCollections = await client.listCollections();
    expect(finalLeftCollections.length).toBe(0);
  }, 10000);
});