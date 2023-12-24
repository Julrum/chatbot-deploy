import { 
  ChatClient, ChildMessage, 
  ChromaClient, Collection, 
  Message, MessageRole, 
  Session, 
  Website } from "@orca.ai/pulse";
import { getFunctionURLFromEnv } from "./common";
import { FunctionName } from "../deploy/gcf";


export let chatClient: ChatClient;
export let chromaClient: ChromaClient;
let testCollection: Collection;
beforeEach(async () => {
  const chatURL = getFunctionURLFromEnv(FunctionName.chat);
  const chromaURL = getFunctionURLFromEnv(FunctionName.chroma);
  chatClient = new ChatClient(chatURL);
  chromaClient = new ChromaClient(chromaURL);
  const testCollectionName = `test-collection-${(new Date()).getTime()}`
  try {
    await chromaClient.createCollection(testCollectionName);
  } catch (error) {
    console.error(`Failed to create test collection: ${testCollectionName}`);
    console.error(`Maybe the Chroma API is not running?`);
    throw error;
  }
});
afterEach(async () => {
  if (testCollection === undefined) {
    return;
  }
  try {
  await chromaClient.deleteCollection(testCollection.name);
  } catch (error) {
    console.error(`Failed to delete test collection: ${testCollection.name}`);
    console.error(`Maybe the Chroma API is not running?`);
    throw error;
  }
});

describe('Chat REST API Test', () => {
  it ('Chat API ping test', async () => {
    try {
      const res = await chatClient.ping();
      expect(res.message).toBe("pong");
    } catch (error) {
      console.error(`Client url: ${chatClient.baseUrl}`);
      console.error(`Failed to ping: ${error}`);
      throw error;
    }
  });
  it('Message CRUD', async () => {
    const websiteToAdd: Website = {
      id: null,
      createdAt: null,
      deletedAt: null,
      name: `test-website-${(new Date()).getTime()}`,
      url: "https://www.google.com",
      description: "test website",
    };
    let website: Website;
    try {
      website = await chatClient.addWebsite(websiteToAdd);
    } catch (error) {
      throw Error(`Failed to add website: ${JSON.stringify(websiteToAdd)}, error: ${error}`);
    }
    expect(website.id).not.toBeNull();
    expect(website.createdAt).not.toBeNull();
    expect(website.deletedAt).toBeNull();
    expect(website.name).toBe(websiteToAdd.name);
    expect(website.url).toBe(websiteToAdd.url);
    expect(website.description).toBe(websiteToAdd.description);
    
    const sessionToAdd: Session = {
      id: null,
      createdAt: null,
      deletedAt: null,
    };
    let session: Session;
    try {
      session = await chatClient.addSession(website.id!, sessionToAdd);
    } catch (error) {
      throw Error(`Failed to add session: ${JSON.stringify(sessionToAdd)}, error: ${error}`);
    }
    expect(session.id).not.toBeNull();
    expect(session.createdAt).not.toBeNull();
    expect(session.deletedAt).toBeNull();

    const messagesToAdd = [1, 2, 3, 4, 5].map(i => ({
      id: null,
      createdAt: null,
      deletedAt: null,
      role: [MessageRole.user, MessageRole.assistant][i % 2],
      children: [
        {
          title: `test-message-${i}`,
          url: `https://www.google.com/${i}`,
          imageUrl: `https://www.google.com/${i}.png`,
          content: `test-message-${i}`,
        } as ChildMessage
      ],
    } as Message));
    for (const messageToAdd of messagesToAdd) {
      try {
        await chatClient.addMessage(website.id!, session.id!, messageToAdd);
      } catch (error) {
        throw Error(`Failed to add message: ${JSON.stringify(messageToAdd)}, error: ${error}`);
      }
    }
    let listedMessages: Message[];
    try {
      listedMessages = await chatClient.listMessages(website.id!, session.id!);
    } catch (error) {
      throw Error(`Failed to list messages, error: ${error}`);
    }
    expect(listedMessages.length).toBe(messagesToAdd.length);
    listedMessages.forEach((listedMessage, i) => {
      expect(listedMessage.id).not.toBeNull();
      expect(listedMessage.createdAt).not.toBeNull();
      expect(listedMessage.deletedAt).toBeNull();
      expect(listedMessage.role).toBe(messagesToAdd[i].role);
      expect(listedMessage.children.length).toBe(messagesToAdd[i].children.length);
      listedMessage.children.forEach((listedChild, j) => {
        expect(listedChild.title).toBe(messagesToAdd[i].children[j].title);
        expect(listedChild.url).toBe(messagesToAdd[i].children[j].url);
        expect(listedChild.imageUrl).toBe(messagesToAdd[i].children[j].imageUrl);
        expect(listedChild.content).toBe(messagesToAdd[i].children[j].content);
      });
    });
    try {
      await chatClient.deleteSession(website.id!, session.id!);
    } catch (error) {
      throw Error(`Failed to delete session: ${session.id}, error: ${error}`);
    }
    try {
      await chatClient.deleteWebsite(website.id!);
    } catch (error) {
      throw Error(`Failed to delete website: ${website.id}, error: ${error}`);
    }
  }, 1 * 60 * 1000);
  it("Query test", async () => {
    const website = await chatClient.addWebsite({
      id: null,
      createdAt: null,
      deletedAt: null,
      name: `test-website-${(new Date()).getTime()}`,
      url: "https://www.google.com",
      description: "test website",
    });
    const sessionToAdd: Session = {
      id: null,
      createdAt: null,
      deletedAt: null,
    };
    const session = await chatClient.addSession(website.id!, sessionToAdd);
    const messagesToAdd = [1, 2, 3, 4, 5].map(i => ({
      id: null,
      createdAt: null,
      deletedAt: null,
      role: [MessageRole.user, MessageRole.assistant][i % 2],
      children: [
        {
          title: `test-message-${i}`,
          url: `https://www.google.com/${i}`,
          imageUrl: `https://www.google.com/${i}.png`,
          content: `test-message-${i}`,
        } as ChildMessage
      ],
    } as Message));
    for (const messageToAdd of messagesToAdd) {
      await chatClient.addMessage(website.id!, session.id!, messageToAdd);
    }
    const queryText = "So, what is the message with the even postfix number?";
    const queryMessage = await chatClient.addMessage(website.id!, session.id!, {
      id: null,
      createdAt: null,
      deletedAt: null,
      role: MessageRole.user,
      children: [
        {
          title: null,
          url: null,
          imageUrl: null,
          content: queryText,
        } as ChildMessage
      ],
    } as Message);
    const retrievals = await chatClient.getRepliesOfMessage(website.id!, session.id!, queryMessage.id!);
    console.info(`QUERY: ${queryText}`);
    console.info(`RETRIEVALS: ${JSON.stringify(retrievals)}`);
    expect(retrievals.length).toBe(1);
    await chatClient.deleteSession(website.id!, session.id!);
    await chatClient.deleteWebsite(website.id!);
  }, 1 * 60 * 1000);
});