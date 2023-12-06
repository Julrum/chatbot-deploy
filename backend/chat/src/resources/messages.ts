import * as admin from "firebase-admin";
import {
  ResourceName, Resource, Collection, convertResourceDates,
} from "./resource";
import {HttpsError} from "firebase-functions/v2/https";

export enum MessageRole {
  user = "user",
  assistant = "assistant",
  system = "system",
}

export interface ChildMessage {
  title: string | null;
  content: string | null;
  imageUrl: string | null;
  url: string | null;
}

export interface Message extends Resource {
  role: MessageRole;
  children: ChildMessage[];
}

export interface MessagesCollection extends Collection<Message> {
  listRecentN: (
    websiteId: string, sessionId: string, n: number) => Promise<Message[]>;
}

export const messagesCollection: MessagesCollection= {
  get: async (websiteId: string, sessionId: string, messageId: string) => {
    const db = admin.firestore();
    const _message = await db
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .collection(ResourceName.Messages)
      .doc(messageId)
      .get();
    if (!_message.exists) {
      throw new HttpsError("not-found", "Message not found");
    }
    const message = convertResourceDates(
      _message.data() as Resource) as Message;
    return message;
  },
  add: async (message: Message, websiteId: string, sessionId: string) => {
    message.children.forEach((child) => {
      if (!child.title &&
        !child.content &&
        !child.imageUrl &&
        !child.url) {
        throw new HttpsError(
          "invalid-argument",
          "Child message must have at least one of" +
          "title, content, imageUrl, or url",
        );
      }
    });
    const db = admin.firestore();
    const ref = db
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .collection(ResourceName.Messages)
      .doc();
    message.id = ref.id;
    message.createdAt = new Date();
    await ref.set(message);
    return message;
  },
  delete: async (websiteId: string, sessionId: string, messageId: string) => {
    const db = admin.firestore();
    const ref = db
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .collection(ResourceName.Messages)
      .doc(messageId);
    await ref.delete();
  },
  list: async (websiteId: string, sessionId: string) => {
    const db = admin.firestore();
    const ref = db
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .collection(ResourceName.Messages)
      .orderBy("createdAt", "asc");
    const messages = await ref.get();
    return messages.docs.map((doc) => {
      return convertResourceDates(doc.data() as Resource) as Message;
    });
  },
  listRecentN: async (websiteId: string, sessionId: string, n: number) => {
    const db = admin.firestore();
    const ref = db
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .collection(ResourceName.Messages)
      .orderBy("createdAt", "desc")
      .limit(n);
    const _messages = await ref.get();
    const messages = _messages.docs.map((doc) => {
      return convertResourceDates(doc.data() as Resource) as Message;
    });
    const sortedMessages = messages.sort((a, b) => {
      const lhs = a.createdAt ? a.createdAt : new Date(0);
      const rhs = b.createdAt ? b.createdAt : new Date(0);
      return lhs.getTime() - rhs.getTime();
    });
    return sortedMessages;
  },
};

