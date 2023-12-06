import * as admin from "firebase-admin";
import {
  ResourceName, Resource, Collection, convertResourceDates,
// eslint-disable-next-line import/namespace
} from "./resource";
import {logger} from "firebase-functions/v2";
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
    const _session = session.data() as Resource;
    try {
      return convertResourceDates(_session);
    } catch (error) {
      logger.error(`Error converting dates: ${error}`);
      throw error;
    }
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
    const _resources = sessionDocs.docs.map((doc) => doc.data() as Resource);
    try {
      return _resources.map((resource) => convertResourceDates(resource));
    } catch (error) {
      logger.error(`Error converting dates: ${error}`);
      throw error;
    }
  },
};

