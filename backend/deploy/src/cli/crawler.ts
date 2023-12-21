import {CrawlerClient, CrawlConfig} from "@orca.ai/pulse";
import {question, quits} from "./common";

async function main() {
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  if (!process.argv[2]) {
    while (true) {
      const opt = await question("Use default API URL (http://localhost:8082)? [Y/n]: ", "y");
      if (opt === "y") {
        process.argv[2] = "http://localhost:8082";
      } else if (opt === "n") {
        console.log("Bye");
        process.exit(0);
      } else {
        console.log("Please enter y or n");
        continue;
      }
      break;
    }
  }
  const apiURL = process.argv[2];
  const client = new CrawlerClient(apiURL);
  console.log("Welcome to Crawler Console");
  console.log("Using API at: " + apiURL);
  while (true) {
    const line = await question(">>> ");
    if (!line) {
      continue;
    }
    if (quits.includes(line)) {
      console.log("Bye");
      break;
    }
    const argv = line.split(" ");
    const argc = argv.length;
    if (argc === 0) {
      continue;
    }
    const command = argv[0];
    switch (command) {
      case "help":
        break;
      case "ping":
        try {
          const res = await client.ping();
          console.log(`Ping response: ${JSON.stringify(res)}`);
        } catch (error) {
          console.error(error);
          continue;
        }
        break;
      case "crawl":
        let config: CrawlConfig = {
          minId: parseInt(await question("Min ID: ", "3000")),
          maxId: parseInt(await question("Max ID: ", "3020")),
          maxRetry: parseInt(await question("Max Retry: ", "3")),
          maxOCRRetry: parseInt(await question("Max OCR Retry: ", "2")),
          maxContentLength: parseInt(await question("Max Content Length: ", "500")),
          maxRecursionDepth: parseInt(await question("Max Recursion Depth: ", "3")),
          collectionName: await question("Collection Name: ", "cli-collection"),
        };
        await client.crawl(config);
        break;
      default:
        console.log(`Unknown command: ${command}`);
        break;
    }
  }
}

main();