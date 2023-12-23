import {
  HttpError, Session,
  ResourceName, convertResourceDates,
} from "@orca.ai/pulse";
import {BaseChatDAO} from "./base";

/**
 * Base class for all DAOs.
 * @class
 * @category DAO
 */
export class SessionDAO extends BaseChatDAO<Session> {
  /**
   * The constructor for the SessionDAO.
   */
  constructor() {
    super();
  }
  /**
   * Get a message by its ID.
   * @param {string} websiteId - The website ID.
   * @param {string} sessionId - The session ID.
   * @return {Promise<Session>} The message.
   */
  async get(
    websiteId: string,
    sessionId: string): Promise<Session> {
    const snapshot = await this.client
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId)
      .get();
    if (!snapshot.exists) {
      // eslint-disable-next-line max-len
      throw new HttpError(404, `Session ${sessionId} not found, website ${websiteId}`);
    }
    let session: Session;
    try {
      session = convertResourceDates(
      snapshot.data() as Session) as Session;
    } catch (error) {
      // eslint-disable-next-line max-len
      throw new HttpError(500, `Error converting session ${sessionId} to Session object, website ${websiteId}, error: ${error}`);
    }
    return session;
  }
  /**
   * Add a message to a session
   * @param {Session} session - The message to add.
   * @param {string} websiteId - The website ID.
   * @return {Promise<Session>} The message.
   */
  async add(
    session: Session,
    websiteId: string): Promise<Session> {
    const ref = this.client
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc();
    session.id = ref.id;
    session.createdAt = new Date();
    await ref.set(session);
    return session;
  }
  /**
   * Delete a message from a session.
   * @param {string} websiteId
   * @param {string} sessionId
   */
  async delete(
    websiteId: string,
    sessionId: string): Promise<void> {
    const ref = this.client
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions)
      .doc(sessionId);
    await ref.delete();
  }
  /**
   * List all messages in a session.
   * @param {string} websiteId
   */
  async list(websiteId: string): Promise<Session[]> {
    const ref = this.client
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .collection(ResourceName.Sessions);
    const sessionDocs = await ref.get();
    return sessionDocs.docs.map((doc) => {
      return convertResourceDates(doc.data() as Session) as Session;
    });
  }
}
