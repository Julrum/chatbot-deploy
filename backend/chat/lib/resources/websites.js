"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websiteCollection = void 0;
const admin = require("firebase-admin");
const resource_1 = require("./resource");
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
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
        const _website = websiteDoc.data();
        try {
            return (0, resource_1.convertResourceDates)(_website);
        }
        catch (error) {
            v2_1.logger.error(`Error converting dates: ${error}`);
            throw error;
        }
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
        const _websites = websiteDocs.docs.map((doc) => doc.data());
        try {
            return _websites.map((website) => (0, resource_1.convertResourceDates)(website));
        }
        catch (error) {
            v2_1.logger.error(`Error converting dates: ${error}`);
            throw error;
        }
    },
};
//# sourceMappingURL=websites.js.map