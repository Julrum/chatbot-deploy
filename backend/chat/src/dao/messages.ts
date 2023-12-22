import {
  HttpError, Message,
  ResourceName, convertResourceDates,
} from "@orca.ai/pulse";
import {BaseChatDAO} from "./base";

/**
 * Base class for all DAOs.
 * @class
 * @category DAO
 */
export class MessageDAO extends BaseChatDAO<Message> {
  /**
   * The constructor for the MessageDAO.
   */
  constructor() {
    super();
  }
  /**
   * Get a message by its ID.
   * @param {string} websiteId - The website ID.
   * @param {string} sessionId - The session ID.
   * @param {string} messageId - The message ID.
   * @return {Promise<Message>} The message.
   */
  async get(
    websiteId: string,
    sessionId: string,
    messageId: string): Promise<Message> {
    const snapshot = await this.client
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .collection(ResourceName.Messages)
      .doc(messageId)
      .get();
    if (!snapshot.exists) {
      // eslint-disable-next-line max-len
      throw new HttpError(404, `Message ${messageId} not found, website ${websiteId}, session ${sessionId}`);
    }
    const message = convertResourceDates(snapshot.data() as Message) as Message;
    return message;
  }
  /**
   * Add a message to a session
   * @param {Message} message - The message to add.
   * @param {string} websiteId - The website ID.
   * @param {string} sessionId - The session ID.
   * @return {Promise<Message>} The message.
   */
  async add(
    message: Message,
    websiteId: string,
    sessionId: string): Promise<Message> {
    message.children.forEach((child) => {
      if (!child.title &&
        !child.content &&
        !child.imageUrl &&
        !child.url) {
        throw new HttpError(
          400,
          "Child message must have at least one of" +
          "title, content, imageUrl, or url",
        );
      }
    });
    const ref = this.client
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .collection(ResourceName.Messages)
      .doc();
    message.id = ref.id;
    message.createdAt = new Date();
    await ref.set(message).then(() => message);
    return message;
  }
  /**
   * Delete a message from a session.
   * @param {string} websiteId
   * @param {string} sessionId
   * @param {string} messageId
   */
  async delete(
    websiteId: string,
    sessionId: string,
    messageId: string): Promise<void> {
    const ref = this.client
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .collection(ResourceName.Messages)
      .doc(messageId);
    await ref.delete();
  }
  /**
   * List all messages in a session.
   * @param {string} websiteId
   * @param {string} sessionId
   */
  async list(websiteId: string, sessionId: string): Promise<Message[]> {
    const ref = this.client
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .collection(ResourceName.Messages)
      .orderBy("createdAt", "asc");
    const messages = await ref.get();
    return messages.docs.map((doc) => {
      return convertResourceDates(doc.data() as Message) as Message;
    });
  }
  /**
   * List the most recent N messages in a session.
   *  @param {string} websiteId
   * @param {string} sessionId
   * @param {number} n
   * @return {Promise<Message[]>}
   */
  async listRecentN(
    websiteId: string,
    sessionId: string,
    n: number): Promise<Message[]> {
    const ref = this.client
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .collection(ResourceName.Messages)
      .orderBy("createdAt", "desc")
      .limit(n);
    const snapshot = await ref.get();
    const messages = snapshot.docs.map((doc) => {
      return convertResourceDates(doc.data() as Message) as Message;
    });
    const sortedMessages = messages.sort((a, b) => {
      const lhs = a.createdAt ? a.createdAt : new Date(0);
      const rhs = b.createdAt ? b.createdAt : new Date(0);
      return lhs.getTime() - rhs.getTime();
    });
    return sortedMessages;
  }
}
