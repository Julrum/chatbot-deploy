import { CrawlRequest, DuplicateCrawlStrategy, ResourceName, } from "@orca.ai/pulse";
import { getFunctionURLFromEnv } from "./common";
import { FunctionName } from "../deploy/gcf";
import { HYSUCrawlerClient, HYSUCrawledDocument } from "@orca.ai/pulse";
import admin from "firebase-admin";

let crawlClient: HYSUCrawlerClient;
let testWebsiteId: string
beforeAll(() => {
  admin.initializeApp();
});
beforeEach(async () => {
  const crawlerURL = getFunctionURLFromEnv(FunctionName.hysuCrawler);
  crawlClient = new HYSUCrawlerClient(crawlerURL);
  testWebsiteId = `test-website-${(new Date()).getTime()}`;
});

afterEach(async () => {
  console.debug(`Deleting test website: ${testWebsiteId}`);
  const db = admin.firestore();
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

describe('Crawler run test', () => {
  it('Crawl 10 pages', async () => {
    const crawlRequest: CrawlRequest = {
      minId: 2990,
      maxId: 3090,
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

    console.debug(`Crawling done. Checking the result with testWebsiteId: ${testWebsiteId}`);
    const db = admin.firestore();
    const collection = db.collection(ResourceName.Websites).doc(testWebsiteId).collection(ResourceName.CrawledDocuments);
    let snapshot: FirebaseFirestore.QuerySnapshot;
    try {
      snapshot = await collection.get();
    } catch (error) {
      console.error(`Failed to get snapshot: ${error}`);
      throw error;
    }
    const crawledDocs = snapshot.docs.map(doc => doc.data() as HYSUCrawledDocument);
    console.debug(`crawledDocs.length: ${crawledDocs.length}`);
    const expectedLength = crawlRequest.maxId - crawlRequest.minId + 1;
    if (crawledDocs.length !== expectedLength) {
      console.warn(
        `crawledDocs.length(${crawledDocs.length}) !== expectedLength(${expectedLength})\n`+
        `Maybe your terminal project is different from the one used in the test?\n`+
        `To switch to dev project, enter:\n`+
        `\tgcloud config set project chatbot-dev-406508\n`+
        `To switch to prod project, enter:\n`+
        `\tgcloud config set project chatbot-32ff4`
      );
    }
    expect(crawledDocs.length).toBe(expectedLength);
    crawledDocs.forEach((crawledDoc, i) => {
      expect(parseInt(crawledDoc.id, 10)).toBe(crawlRequest.minId + i);
      expect(crawledDoc.title).toBeTruthy();
      // Excluded because of
      // https://startup.hanyang.ac.kr/board/notice/view/3003?boardName=notice
      expect(crawledDoc.content).not.toBeNull();
      expect(crawledDoc.viewCnt).not.toBeNull();
      expect(crawledDoc.viewCnt).toBeGreaterThanOrEqual(0);
    });

  },
  6 * 60 * 1000);
});
