"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesCollection = exports.MessageRole = void 0;
const admin = require("firebase-admin");
const resource_1 = require("./resource");
const https_1 = require("firebase-functions/v2/https");
var MessageRole;
(function (MessageRole) {
    MessageRole["user"] = "user";
    MessageRole["assistant"] = "assistant";
    MessageRole["system"] = "system";
})(MessageRole || (exports.MessageRole = MessageRole = {}));
exports.messagesCollection = {
    get: async (websiteId, sessionId, messageId) => {
        const db = admin.firestore();
        const message = await db
            .collection(resource_1.ResourceName.Websites)
            .doc(websiteId)
            .collection(resource_1.ResourceName.Sessions)
            .doc(sessionId)
            .collection(resource_1.ResourceName.Messages)
            .doc(messageId)
            .get();
        if (!message.exists) {
            throw new https_1.HttpsError("not-found", "Message not found");
        }
        return message.data();
    },
    add: async (message, websiteId, sessionId) => {
        message.children.forEach((child) => {
            if (!child.title &&
                !child.content &&
                !child.imageUrl &&
                !child.url) {
                throw new https_1.HttpsError("invalid-argument", "Child message must have at least one of" +
                    "title, content, imageUrl, or url");
            }
        });
        const db = admin.firestore();
        const ref = db
            .collection(resource_1.ResourceName.Websites)
            .doc(websiteId)
            .collection(resource_1.ResourceName.Sessions)
            .doc(sessionId)
            .collection(resource_1.ResourceName.Messages)
            .doc();
        message.id = ref.id;
        message.createdAt = new Date();
        await ref.set(message);
        return message;
    },
    delete: async (websiteId, sessionId, messageId) => {
        const db = admin.firestore();
        const ref = db
            .collection(resource_1.ResourceName.Websites)
            .doc(websiteId)
            .collection(resource_1.ResourceName.Sessions)
            .doc(sessionId)
            .collection(resource_1.ResourceName.Messages)
            .doc(messageId);
        await ref.delete();
    },
    list: async (websiteId, sessionId) => {
        const db = admin.firestore();
        const ref = db
            .collection(resource_1.ResourceName.Websites)
            .doc(websiteId)
            .collection(resource_1.ResourceName.Sessions)
            .doc(sessionId)
            .collection(resource_1.ResourceName.Messages);
        const messages = await ref.get();
        return messages.docs.map((doc) => doc.data());
    },
};
//# sourceMappingURL=messages.js.map