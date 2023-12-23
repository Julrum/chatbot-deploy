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
    let snapshot: FirebaseFirestore.DocumentSnapshot;
    try {
      snapshot = await this.client
        .collection(ResourceName.Websites)
        .doc(websiteId)
        .collection(ResourceName.Sessions)
        .doc(sessionId)
        .collection(ResourceName.Messages)
        .doc(messageId)
        .get();
    } catch (error) {
      // eslint-disable-next-line max-len
      throw new HttpError(404, `Message ${messageId} not found, website ${websiteId}, session ${sessionId}, error: ${error}`);
    }
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
    try {
      await ref.set(message).then(() => message);
    } catch (error) {
      // eslint-disable-next-line max-len
      throw new HttpError(500, `Failed to add message ${message.id}, error: ${error}`);
    }
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
    try {
      await ref.get();
    } catch (error) {
      // eslint-disable-next-line max-len
      throw new HttpError(404, `Message ${messageId} not found, website ${websiteId}, session ${sessionId}, error: ${error}`);
    }
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
    let snapshot: FirebaseFirestore.QuerySnapshot;
    try {
      snapshot = await ref.get();
    } catch (e) {
      throw new HttpError(404, `Session ${sessionId} not found, error: ${e}`);
    }
    let messages: Message[] = [];
    try {
      messages = snapshot.docs.map((doc) => {
        return convertResourceDates(doc.data() as Message) as Message;
      });
    } catch (e) {
      // eslint-disable-next-line max-len
      throw new HttpError(500, `Failed to convert firestore snapshot to Message[], error: ${e}`);
    }
    return messages;
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
    let snapshot: FirebaseFirestore.QuerySnapshot;
    try {
      snapshot = await ref.get();
    } catch (error) {
      // eslint-disable-next-line max-len
      throw new HttpError(404, `Session ${sessionId} not found, error: ${error}`);
    }
    let messages: Message[] = [];
    try {
      messages = snapshot.docs.map((doc) => {
        return convertResourceDates(doc.data() as Message) as Message;
      });
    } catch (error) {
      // eslint-disable-next-line max-len
      throw new HttpError(500, `Failed to convert firestore snapshot to Message[], error: ${error}`);
    }
    let sortedMessages: Message[] = [];
    try {
      sortedMessages = messages.sort((a, b) => {
        const lhs = a.createdAt ? a.createdAt : new Date(0);
        const rhs = b.createdAt ? b.createdAt : new Date(0);
        return lhs.getTime() - rhs.getTime();
      });
    } catch (error) {
    // eslint-disable-next-line max-len
      throw new HttpError(500, `Failed to sort messages, error: ${error}`);
    }
    return sortedMessages;
  }
}
