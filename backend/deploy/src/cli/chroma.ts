import {ChromaClient, Collection, Document} from "@orca.ai/pulse";
import {question} from "./common";

interface ChromaURI {
  collection?: string;
  document?: string;
}
function parseURI(uri: string | undefined): ChromaURI {
  uri ??= "";
  const parts = uri.split("/");
  const collection = parts[0];
  const document = parts[1];
  return {collection, document};
}

async function main() {
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  if (!process.argv[2]) {
    while (true) {
      const opt = await question("Use default API URL (http://localhost:8081)? [y/n]: ");
      if (opt === "y") {
        process.argv[2] = "http://localhost:8081";
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
  const client = new ChromaClient(apiURL);
  const quits = ["exit", "quit", "q", "bye"];
  console.log("Welcome to Chroma DB Console");
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
    const target = argv[1];
    const uri = parseURI(target);
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
      case "create":
        if (!uri.collection) {
          console.log("Please specify URI like: <collection>/<document> or <collection>");
          continue;
        }
        if (uri.collection && !uri.document) {
          let collection: Collection;
          try {
            collection = await client.createCollection(uri.collection);
          } catch (error) {
            console.error(error);
            continue;
          }
          console.log(`Created collection id=${collection.id} name=${collection.name}`);
        } else if (uri.collection && uri.document) {
          const content = await question("Enter content: ") ?? "";
          try {
            await client.addDocuments(uri.collection, [{
              id: uri.document,
              content: content,
              metadata: {},
            } as Document]);
          } catch (error) {
            console.error(error);
            continue;
          }
        } else {
          console.log("Please specify URI like: <collection>/<document> or <collection>");
          continue;
        }
        break;
      case "list":
        if (!uri.collection) {
          let collections: Collection[];
          try {
            collections = await client.listCollections();
          } catch (error) {
            console.error(error);
            continue;
          }
          console.log(`Found ${collections.length} collections:`);
          for (const c of collections) {
            console.log(`name=${c.name}\tid=${c.id}`);
          }
        } else {
          console.log(`Listing documents is not supported yet.`);
        }
        break;
      case "count":
        if (!uri.collection) {
          console.log("Please specify URI like: <collection>");
          continue;
        }
        let count: number;
        try {
          count = await client.countDocumentsInCollection(uri.collection);
        } catch (error) {
          console.error(error);
          continue;
        }
        console.log(`Found ${count} documents in collection ${uri.collection}`);
        break;
      case "get":
        if (!uri.collection) {
          console.log("Please specify URI like: <collection>/<document> or <collection>");
          continue;
        }
        if (!uri.document) {
          let collection: Collection;
          try {
            collection = await client.getCollection(uri.collection);
          } catch (error) {
            console.error(error);
            continue;
          }
          console.log(`Found collection id=${collection.id} name=${collection.name}`);
        } else {
          let document: Document | null = null;
          try {
            document = await client.getDocument(uri.collection, uri.document);
          } catch (error) {
            console.error(error);
            continue;
          }
          if (!document) {
            console.log(`Document id=${uri.document} not found`);
            continue;
          }
          console.log(`Found document id=${document.id} content=${document.content}`);
        }
        break;
      case "delete":
        if (uri.collection && !uri.document) {
          try {
            await client.deleteCollection(uri.collection);
          } catch (error) {
            console.error(error);
            continue;
          }
          console.log(`Deleted collection id=${uri.collection}`);
        } else if (uri.collection && uri.document) {
          try {
            await client.deleteDocument(uri.collection, uri.document);
          } catch (error) {
            console.error(error);
            continue;
          }
          console.log(`Deleted document id=${uri.document}`);
        } else {
          console.log("Please specify URI like: <collection>/<document> or <collection>");
          continue;
        }
        break;
      default:
        console.log(`Unknown command: ${command}`);
        break;
    }
  }
}

main();