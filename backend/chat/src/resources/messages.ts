import * as admin from "firebase-admin";
import {ResourceName, Resource, Collection} from "./resource";
import {HttpsError} from "firebase-functions/v2/https";

export enum MessageRole {
  user = "user",
  assistant = "assistant",
  system = "system",
}

export interface ChildMessage {
  title: string | null;
  role: MessageRole;
  content: string | null;
  imageUrl: string | null;
  url: string | null;
}

export interface Message extends Resource {
  children: ChildMessage[];
}

export const messagesCollection: Collection<Message> = {
  get: async (websiteId: string, sessionId: string, messageId: string) => {
    const db = admin.firestore();
    const message = await db
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .collection(ResourceName.Messages)
      .doc(messageId)
      .get();
    if (!message.exists) {
      throw new HttpsError("not-found", "Message not found");
    }
    return message.data() as Message;
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
      .collection(ResourceName.Messages);
    const messages = await ref.get();
    return messages.docs.map((doc) => doc.data() as Message);
  },
};

