"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websiteCollection = void 0;
const admin = require("firebase-admin");
const resource_1 = require("./resource");
const https_1 = require("firebase-functions/v2/https");
exports.websiteCollection = {
    get: async (websiteId) => {
        const db = admin.firestore();
        const websiteDoc = await db
            .collection(resource_1.ResourceName.Websites)
            .doc(websiteId)
            .get();
        if (!websiteDoc.exists) {
            throw new https_1.HttpsError("not-found", "Website not found");
        }
        return websiteDoc.data();
    },
    add: async (website) => {
        const db = admin.firestore();
        const websiteRef = db.collection(resource_1.ResourceName.Websites).doc();
        website.id = websiteRef.id;
        website.createdAt = new Date();
        await websiteRef.set(website);
        return website;
    },
    delete: async (websiteId) => {
        const db = admin.firestore();
        const websiteRef = db.collection(resource_1.ResourceName.Websites).doc(websiteId);
        await websiteRef.delete();
    },
    list: async () => {
        const db = admin.firestore();
        const websitesRef = db.collection(resource_1.ResourceName.Websites);
        const websiteDocs = await websitesRef.get();
        return websiteDocs.docs.map((doc) => doc.data());
    },
};
//# sourceMappingURL=websites.js.map