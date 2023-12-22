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
  await chromaClient.createCollection(testCollectionName);
});
afterEach(async () => {
  if (testCollection === undefined) {
    return;
  }
  await chromaClient.deleteCollection(testCollection.name);
});

describe('Chat REST API Test', () => {
  it('Message CRUD', async () => {
    const websiteToAdd: Website = {
      id: null,
      createdAt: null,
      deletedAt: null,
      name: `test-website-${(new Date()).getTime()}`,
      url: "https://www.google.com",
      description: "test website",
    };
    const website = await chatClient.addWebsite(websiteToAdd);
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
    const session = await chatClient.addSession(website.id!, sessionToAdd);
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
      await chatClient.addMessage(website.id!, session.id!, messageToAdd);
    }
    const listedMessages = await chatClient.listMessages(website.id!, session.id!);
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
    await chatClient.deleteSession(website.id!, session.id!);
    await chatClient.deleteWebsite(website.id!);
  });
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