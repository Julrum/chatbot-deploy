import * as admin from "firebase-admin";
import {ResourceName, Resource, Collection} from "./resource";
import {HttpsError} from "firebase-functions/v2/https";

export interface Website extends Resource {
  name: string;
  url: string;
  description: string;
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
    return websiteDoc.data() as Website;
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
    return websiteDocs.docs.map((doc) => doc.data() as Website);
  },
};

