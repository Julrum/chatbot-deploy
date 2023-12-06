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
        const _message = await db
            .collection(resource_1.ResourceName.Websites)
            .doc(websiteId)
            .collection(resource_1.ResourceName.Sessions)
            .doc(sessionId)
            .collection(resource_1.ResourceName.Messages)
            .doc(messageId)
            .get();
        if (!_message.exists) {
            throw new https_1.HttpsError("not-found", "Message not found");
        }
        const message = (0, resource_1.convertResourceDates)(_message.data());
        return message;
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
            .collection(resource_1.ResourceName.Messages)
            .orderBy("createdAt", "asc");
        const messages = await ref.get();
        return messages.docs.map((doc) => {
            return (0, resource_1.convertResourceDates)(doc.data());
        });
    },
    listRecentN: async (websiteId, sessionId, n) => {
        const db = admin.firestore();
        const ref = db
            .collection(resource_1.ResourceName.Websites)
            .doc(websiteId)
            .collection(resource_1.ResourceName.Sessions)
            .doc(sessionId)
            .collection(resource_1.ResourceName.Messages)
            .orderBy("createdAt", "desc")
            .limit(n);
        const _messages = await ref.get();
        const messages = _messages.docs.map((doc) => {
            return (0, resource_1.convertResourceDates)(doc.data());
        });
        const sortedMessages = messages.sort((a, b) => {
            const lhs = a.createdAt ? a.createdAt : new Date(0);
            const rhs = b.createdAt ? b.createdAt : new Date(0);
            return lhs.getTime() - rhs.getTime();
        });
        return sortedMessages;
    },
};
//# sourceMappingURL=messages.js.map