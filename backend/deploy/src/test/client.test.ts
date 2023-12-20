import { Client, Collection, Document } from "@orca.ai/pulse";

async function cleanDB(client: Client) {
  const collections = await client.listCollections();
  await Promise.all(collections.map(async collection => {
    await client.deleteCollection(collection.name);
  }));
  const leftCollections = await client.listCollections();
  expect(leftCollections.length).toBe(0);
}

let client: Client;
let testCollection: Collection;
beforeAll(async () => {
  const functionURL = process.env.FUNCTION_URL;
  if (!functionURL) {
    throw new Error('FUNCTION_URL is not set, it should be like: https://us-central1-<project-name>.cloudfunctions.net/<function-name> OR http://localhost:8080');
  }
  client = new Client(functionURL);
  await cleanDB(client);
  const collectionName = `test-collection-${(new Date()).getTime()}`;
  testCollection = await client.createCollection(collectionName);
});
afterAll(async () => {
  if (testCollection === undefined) {
    return;
  }
  await client.deleteCollection(testCollection.name);
});

describe('Chroma Document CRUD', () => {
  it('Create and delete a document', async () => {
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
  });
});

// describe('Chroma Collection CRUD', () => {
//   it('Create and delete a collection', async () => {
//     const initialCollections = await client.listCollections();
//     expect(initialCollections.length).toBe(0);

//     const newCollection = await client.createCollection(testCollection.name);
//     expect(newCollection.name).toBe(testCollection.name);

//     const collections = await client.listCollections();
//     expect(collections.length).toBe(1);

//     const collection = await client.getCollection(testCollection.name);
//     expect(collection.name).toBe(testCollection.name);

//     await client.deleteCollection(testCollection.name);
//     const leftCollections = await client.listCollections();
//     expect(leftCollections.length).toBe(0);
//   });
// });