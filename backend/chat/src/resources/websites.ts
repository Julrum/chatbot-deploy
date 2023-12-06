import * as admin from "firebase-admin";
import {
  ResourceName, Resource, Collection, convertResourceDates,
// eslint-disable-next-line import/namespace
} from "./resource";
import {HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";

export interface Website extends Resource {
  name: string;
  url: string;
  description: string;
  imageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  disclaimer?: string;
}

export const websiteCollection: Collection<Website> = {
  get: async (websiteId: string) => {
    const db = admin.firestore();
    const websiteDoc = await db
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .get();
    if (!websiteDoc.exists) {
      throw new HttpsError("not-found", "Website not found");
    }
    const _website = websiteDoc.data() as Website;
    try {
      return convertResourceDates(_website) as Website;
    } catch (error) {
      logger.error(`Error converting dates: ${error}`);
      throw error;
    }
  },
  add: async (website: Website) => {
    const db = admin.firestore();
    const websiteRef = db.collection(ResourceName.Websites).doc();
    website.id = websiteRef.id;
    website.createdAt = new Date();
    await websiteRef.set(website);
    return website;
  },
  delete: async (websiteId: string) => {
    const db = admin.firestore();
    const websiteRef = db.collection(ResourceName.Websites).doc(websiteId);
    await websiteRef.delete();
  },
  list: async () => {
    const db = admin.firestore();
    const websitesRef = db.collection(ResourceName.Websites);
    const websiteDocs = await websitesRef.get();
    const _websites = websiteDocs.docs.map((doc) => doc.data() as Website);
    try {
      return _websites.map(
        (website) => convertResourceDates(website) as Website);
    } catch (error) {
      logger.error(`Error converting dates: ${error}`);
      throw error;
    }
  },
};

