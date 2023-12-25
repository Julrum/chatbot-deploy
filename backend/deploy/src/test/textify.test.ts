import { CrawlRequest, DuplicateCrawlStrategy, HYSUCrawledDocument, HYSUCrawlerClient, ResourceName} from "@orca.ai/pulse";
import { getFunctionURLFromEnv } from "./common";
import { FunctionName } from "../deploy/gcf";
import { TextifyClient, TextifyResponse, TextifyText } from "@orca.ai/pulse";
import admin from "firebase-admin";
import { getFirebaseAppByPhase } from "./firebase-helper";

let crawlClient: HYSUCrawlerClient;
let textifyClient: TextifyClient;
let testWebsiteId: string
let firebaseApp: admin.app.App;
beforeAll(() => {
  firebaseApp = getFirebaseAppByPhase();
});
beforeEach(async () => {
  const textifyURL = getFunctionURLFromEnv(FunctionName.textify);
  const crawlerURL = getFunctionURLFromEnv(FunctionName.hysuCrawler);
  crawlClient = new HYSUCrawlerClient(crawlerURL);
  textifyClient = new TextifyClient(textifyURL);
  testWebsiteId = `test-website-${(new Date()).getTime()}`;
});

afterEach(async () => {
  console.debug(`Deleting test website: ${testWebsiteId}`);
  const db = firebaseApp.firestore();
  if (testWebsiteId === undefined) {
    return;
  }
  try {
    await db.collection(ResourceName.Websites).doc(testWebsiteId).delete();
  } catch (error) {
    console.error(`Failed to delete test website: ${testWebsiteId}`);
    throw error;
  }
  console.debug(`Deleted test website: ${testWebsiteId}`);
});

describe('Textify Test', () => {
  it('Textify single document', async () => {
    const crawlRequest: CrawlRequest = {
      minId: 3080,
      maxId: 3085,
      retryConfig: {
        maxRetry: 3,
        intervalInMilliseconds: undefined,
      },
      duplicateCrawlStrategy: DuplicateCrawlStrategy.overwrite,
      websiteId: testWebsiteId,
    };
    console.debug(`Sending crawl request: ${JSON.stringify(crawlRequest)}`);
    try {
      await crawlClient.crawl(crawlRequest);
    } catch (error) {
      console.error(`Failed to crawl: ${JSON.stringify(crawlRequest)}`);
      throw error;
    }

    console.debug(`Crawling done. Double checking the result...`);
    const db = firebaseApp.firestore();
    const c = db.collection(ResourceName.Websites).doc(testWebsiteId).collection(ResourceName.CrawledDocuments);
    let s: FirebaseFirestore.QuerySnapshot;
    try {
      s = await c.get();
    } catch (error) {
      console.error(`Failed to get snapshot: ${error}`);
      throw error;
    }
    console.debug(`s.docs.length: ${s.docs.length}`);
    const crawledDocuments = s.docs.map(doc => doc.data() as HYSUCrawledDocument);
    console.debug(`crawledDocuments.length: ${crawledDocuments.length}`);
    expect(crawledDocuments.length).toBe(crawlRequest.maxId - crawlRequest.minId + 1);

    const numDocuments = crawlRequest.maxId - crawlRequest.minId + 1;
    const documentIds = Array(numDocuments).fill(0).map((_, i) => `${i + crawlRequest.minId}`);
    const textLengths = [100, 500, 1000];
    let textifyResponse: TextifyResponse;
    try {
      textifyResponse = await textifyClient.textify(testWebsiteId, documentIds, textLengths);
    } catch (error) {
      console.error(`Failed to textify, websiteId: ${testWebsiteId}, documentIds: ${documentIds}, textLengths: ${textLengths}, error: ${error}`);
      throw error;
    }
    console.debug(`Textify done. Checking the result...`);
    const textIds = textifyResponse.textIds;
    const collection = db.collection(ResourceName.Websites).doc(testWebsiteId).collection(ResourceName.Texts);
    let snapshot: FirebaseFirestore.QuerySnapshot;
    try {
      snapshot = await collection.get();
    } catch (error) {
      console.error(`Failed to get snapshot: ${error}`);
      throw error;
    }
    const textsInDB = snapshot.docs.map(doc => doc.data() as TextifyText);
    console.debug(`texts first doc: ${JSON.stringify(textsInDB[0])}`);
    console.debug(`texts.length: ${textsInDB.length}`);
    expect(textsInDB.length).toBe(textIds.length);
    for (const text of textsInDB) {
      expect(text.id).not.toBeUndefined();
    }
    const sortedTextsInDB = textsInDB.sort((a, b) => a.id! < b.id! ? -1 : 1);
    const sortedTexts = textIds.sort((a, b) => a < b ? -1 : 1);
    expect(sortedTextsInDB.map(text => text.id)).toStrictEqual(sortedTexts);
  },
  6 * 60 * 1000);
});
