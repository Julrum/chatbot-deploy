import { 
  HYSUCrawlerClient,
  CrawlRequest,
  // HYSUApiResponse,
  TextifyClient,
  // TextifyRequest,
  TextifyResponse,
  DuplicateCrawlStrategy,
  ChromaClient,
  ResourceName,
  TextifyText,
} from "@orca.ai/pulse";
import { getFunctionURLFromEnv } from "../test/common";
import { FunctionName } from "../deploy/gcf";
import { question, quits } from "./common";
import { getFirebaseAppByPhase } from "../test/firebase-helper";

async function main(): Promise<void> {
  const firebaseApp = getFirebaseAppByPhase();
  const crawlerURL = getFunctionURLFromEnv(FunctionName.hysuCrawler);
  const crawlClient = new HYSUCrawlerClient(crawlerURL);
  const textifyURL = getFunctionURLFromEnv(FunctionName.textify);
  const textifyClient = new TextifyClient(textifyURL);
  const chromaUrl = getFunctionURLFromEnv(FunctionName.chroma);
  const chromaClient = new ChromaClient(chromaUrl);
  console.log("Welcome to HYSU Crawler CLI");
  console.info(`Crawler URL: ${crawlerURL}`);
  while (true) {
    const userInput = await question(">>> ");
    switch(userInput) {
      case undefined:
        continue;
      case null:
        continue;
      case "":
        continue;
      case "help":
        console.info("Commands:");
        console.info("  help: show this message");
        console.info("  ping: ping the crawler");
        console.info("  crawl: crawl a website");
        continue;
      case "ping":
        try {
          const response = await crawlClient.ping();
          console.info(`Ping response: ${JSON.stringify(response)}`);
        } catch (error) {
          console.error(`Failed to ping: ${error}`);
        }
        continue;
      case "crawl":
        const websiteId = await question("Website ID: ");
        const minId = await question("Min ID: ");
        const maxId = await question("Max ID: ");
        const textLengthsInString = await question("Text lengths (comma separated): ");
        let textLengths: number[];
        try {
          textLengths = textLengthsInString.split(",").map((s) => parseInt(s, 10));
        } catch (error) {
          console.error(`Failed to parse text lengths: ${error}`);
          continue;
        }
        const request: CrawlRequest = {
          websiteId,
          minId: parseInt(minId),
          maxId: parseInt(maxId),
          retryConfig: {
            maxRetry: 3,
            intervalInMilliseconds: undefined,
          },
          duplicateCrawlStrategy: DuplicateCrawlStrategy.overwrite,
        };
        console.info(`Sending crawl request: ${JSON.stringify(request)}`);
        try {
          await crawlClient.crawl(request);
          console.log("Crawling finished.");
        } catch (error) {
          console.error(`Failed to crawl: ${error}`);
          break;
        }
        const documentIds = Array(request.maxId - request.minId + 1).fill(0).map((_, i) => `${i + request.minId}`);
        let textifyResponse: TextifyResponse;
        try {
          textifyResponse = await textifyClient.textify(
            websiteId,
            documentIds,
            textLengths,
          );
        } catch (error) {
          console.error(`Failed to textify: ${error}`);
          break;
        }
        try {
          await chromaClient.getCollection(websiteId);
        } catch (error) {
          try {
            await chromaClient.createCollection(websiteId);
          } catch (error) {
            console.error(`Failed to create the missing collection ${websiteId}, error: ${error}`);
            break;
          }
        }
        const db = firebaseApp.firestore();
        const collection = db.collection(ResourceName.Websites).doc(websiteId).collection(ResourceName.Texts);
        const docRefs = textifyResponse.textIds.map((textId) => collection.doc(textId));
        let snapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>[];
        try {
          snapshot = await db.getAll(...docRefs);
        } catch (error) {
          console.error(`Failed to get snapshot: ${error}`);
          break;
        }
        const textsInDB = snapshot.map(doc => doc.data() as TextifyText);
        console.debug(`Found ${textsInDB.length} texts in DB`);
        try {
          await chromaClient.addCrawledTexts(websiteId, textsInDB);
        } catch (error) {
          console.error(`Failed to add crawled texts: ${error}`);
          console.error(`Rolling back the textify result...`);
          // TODO: Move this textify rollback logic into textify API and call it using the client.
          const batch = db.batch();
          docRefs.forEach((ref) => batch.delete(ref));
          try {
            await batch.commit();
            console.info("Succesfully rolled back the textify result.");
          } catch (error) {
            console.error(`Failed to delete textify result: ${error}`);
            console.error(`Please delete the following textify result manually:`);
            textsInDB.forEach((t) => console.error(JSON.stringify(t)));
          }
        }
        console.log("Added crawled texts to Chroma.");
        console.log("Done.");
        continue;
      default:
        if (quits.includes(userInput)) {
          console.info("Bye!");
          break;
        } else {
          console.info(`Unknown command: ${userInput}`);
          continue;
        }
    }
  }

}

main();