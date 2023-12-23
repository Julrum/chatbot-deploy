import { 
  LikeClient, LikeMessage
} from "@orca.ai/pulse";
import { getFunctionURLFromEnv } from "./common";
import { FunctionName } from "../deploy/gcf";
import admin from "firebase-admin";
import { LikeUnLike } from "@orca.ai/pulse/lib/like/types";

let likeClient: LikeClient;
const likeIds: string[] = [];
beforeEach(async () => {
  admin.initializeApp();
  const likeURL = getFunctionURLFromEnv(FunctionName.like);
  if (!likeURL) {
    throw new Error(`likeURL is null`);
  }
  likeClient = new LikeClient(likeURL);
});
afterEach(async () => {
  const db = admin.firestore();
  const batch = db.batch();
  const deleteRefs = likeIds.map(likeId => db.collection("likes").doc(likeId));
  deleteRefs.forEach(deleteRef => batch.delete(deleteRef));
  await batch.commit();
});

describe('Like RPC API Test', () => {
  it('Like Unlike Test', async () => {
    const websiteIds = [1, 2, 3].map(i => `website-${i}`);
    const sessionIds = [1, 2, 3].map(i => `session-${i}`);
    const lastMessageIds = [1, 2, 3].map(i => `last-message-${i}`);
    const combinations: LikeMessage[] = [];
    for (const websiteId of websiteIds) {
      for (const sessionId of sessionIds) {
        for (const lastMessageId of lastMessageIds) {
          combinations.push({
            websiteId,
            sessionId,
            lastMessageId,
            comment: `comment: websiteId=${websiteId}, sessionId=${sessionId}, lastMessageId=${lastMessageId}`,
          } as LikeMessage);
        }
      }
    }
    const promises = combinations.map(async (c, i) => {
      return await likeClient.sendLikeOrUnlike(
        c.websiteId,
        c.sessionId,
        c.lastMessageId,
        i % 3 === 0 ? LikeUnLike.like : LikeUnLike.unlike,
        c.comment,
      );
    });
    console.log(`promises.length: ${promises.length}`);
    const likeMessages = await Promise.all(promises);
    likeIds.push(...likeMessages.map(likeMessage => likeMessage.id!));

    expect(likeMessages.length).toBe(combinations.length);
    likeMessages.forEach(likeMessage => {
      expect(likeMessage.id).not.toBeNull();
      expect(likeMessage.createdAt).not.toBeNull();
      expect(likeMessage.websiteId).not.toBeNull();
      expect(likeMessage.sessionId).not.toBeNull();
      expect(likeMessage.lastMessageId).not.toBeNull();
      expect(likeMessage.comment).not.toBeNull();
    });
    likeMessages.forEach((likeMessage, i) => {
      expect(likeMessage.websiteId).toBe(combinations[i].websiteId);
      expect(likeMessage.sessionId).toBe(combinations[i].sessionId);
      expect(likeMessage.lastMessageId).toBe(combinations[i].lastMessageId);
      expect(likeMessage.comment).toBe(combinations[i].comment);
    });
  }, 1 * 60 * 1000);
});