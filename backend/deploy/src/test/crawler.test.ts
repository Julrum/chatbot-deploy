import { CrawlerClient, ChromaClient, Collection, CrawlConfig } from "@orca.ai/pulse";
import { getFunctionURLFromEnv } from "./common";
import { FunctionName } from "../deploy/gcf";

let chromaClient: ChromaClient;
let crawlClient: CrawlerClient;
let testCollection: Collection;
beforeEach(async () => {
  const functionURL = getFunctionURLFromEnv(FunctionName.crawler);
  const chromaURL = getFunctionURLFromEnv(FunctionName.chroma);
  console.debug(`chromaURL: ${chromaURL}`);
  chromaClient = new ChromaClient(chromaURL);
  crawlClient = new CrawlerClient(functionURL);

});
afterEach(async () => {
  if (testCollection === undefined) {
    return;
  }
});

describe('Crawler run test', () => {
  it('Crawl 10 pages', async () => {
    const testCollectionName = `test-collection-${(new Date()).getTime()}`
    try {
      testCollection = await chromaClient.createCollection(testCollectionName);
      console.debug(`Created test collection: ${testCollectionName}`);
    } catch (error) {
      console.error(`Failed to create test collection: ${testCollectionName}`);
      throw error;
    }
    
    try {
      const initialDocuments = await chromaClient.countDocumentsInCollection(testCollection.name);
      expect(initialDocuments).toBe(0);
    } catch (error) {
      console.error(`Failed to count documents in collection: ${testCollection.name}`);
      await chromaClient.deleteCollection(testCollection.name);
      throw error;
    }

    const crawlConfig: CrawlConfig = {
      minId: 3000,
      maxId: 3010,
      maxRetry: 3,
      maxOCRRetry: 2,
      maxContentLength: 500,
      maxRecursionDepth: 3,
      collectionName: testCollection.name,
    };
    try {
      await crawlClient.crawl(crawlConfig);
    } catch (error) {
      console.error(`Failed to crawl: ${JSON.stringify(crawlConfig)}`);
      await chromaClient.deleteCollection(testCollection.name);
      throw error;
    }
    try {
      const documentsInCollection = await chromaClient.countDocumentsInCollection(testCollection.name);
      expect (documentsInCollection).toBeGreaterThanOrEqual(crawlConfig.maxId - crawlConfig.minId + 1);
    } catch (error) {
      console.error(`Failed to count documents in collection: ${testCollection.name}`);
      await chromaClient.deleteCollection(testCollection.name);
      throw error;
    }
    await chromaClient.deleteCollection(testCollection.name);
  },
  6 * 60 * 1000);
});
