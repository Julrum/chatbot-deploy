"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionCollection = void 0;
const admin = require("firebase-admin");
const resource_1 = require("./resource");
const https_1 = require("firebase-functions/v2/https");
exports.sessionCollection = {
    get: async (websiteId, sessionId) => {
        const db = admin.firestore();
        const session = await db
            .collection(resource_1.ResourceName.Websites)
            .doc(websiteId)
            .collection(resource_1.ResourceName.Sessions)
            .doc(sessionId)
            .get();
        if (!session.exists) {
            throw new https_1.HttpsError("not-found", "Session not found");
        }
        return session.data();
    },
    add: async (session, websiteId) => {
        const db = admin.firestore();
        const ref = db
            .collection(resource_1.ResourceName.Websites)
            .doc(websiteId)
            .collection(resource_1.ResourceName.Sessions)
            .doc();
        session.id = ref.id;
        session.createdAt = new Date();
        await ref.set(session);
        return session;
    },
    delete: async (websiteId, sessionId) => {
        const db = admin.firestore();
        const ref = db
            .collection(resource_1.ResourceName.Websites)
            .doc(websiteId)
            .collection(resource_1.ResourceName.Sessions)
            .doc(sessionId);
        await ref.delete();
    },
    list: async (websiteId) => {
        const db = admin.firestore();
        const sessionDocs = await db
            .collection(resource_1.ResourceName.Websites)
            .doc(websiteId)
            .collection(resource_1.ResourceName.Sessions)
            .get();
        return sessionDocs.docs.map((doc) => doc.data());
    },
};
//# sourceMappingURL=sessions.js.map