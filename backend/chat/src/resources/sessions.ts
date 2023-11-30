import * as admin from "firebase-admin";
import {ResourceName, Resource, Collection} from "./resource";
import {HttpsError} from "firebase-functions/v2/https";


export const sessionCollection: Collection<Resource> = {
  get: async (websiteId: string, sessionId: string) => {
    const db = admin.firestore();
    const session = await db
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .get();
    if (!session.exists) {
      throw new HttpsError("not-found", "Session not found");
    }
    return session.data() as Resource;
  },
  add: async (session: Resource, websiteId: string) => {
    const db = admin.firestore();
    const ref = db
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc();
    session.id = ref.id;
    session.createdAt = new Date();
    await ref.set(session);
    return session;
  },
  delete: async (websiteId: string, sessionId: string) => {
    const db = admin.firestore();
    const ref = db
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId);
    await ref.delete();
  },
  list: async (websiteId: string) => {
    const db = admin.firestore();
    const sessionDocs = await db
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .get();
    return sessionDocs.docs.map((doc) => doc.data() as Resource);
  },
};

