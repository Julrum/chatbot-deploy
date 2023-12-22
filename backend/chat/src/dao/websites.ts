import {
  HttpError, Website,
  ResourceName, convertResourceDates,
} from "@orca.ai/pulse";
import {BaseChatDAO} from "./base";

/**
 * Base class for all DAOs.
 * @class
 * @category DAO
 */
export class WebsiteDAO extends BaseChatDAO<Website> {
  /**
   * The constructor for the WebsiteDAO.
   */
  constructor() {
    super();
  }
  /**
   * Get a message by its ID.
   * @param {string} websiteId - The website ID.
   * @return {Promise<Website>} The message.
   */
  async get(
    websiteId: string): Promise<Website> {
    const snapshot = await this.client
      .collection(ResourceName.Websites)
      .doc(websiteId)
      .get();
    if (!snapshot.exists) {
      // eslint-disable-next-line max-len
      throw new HttpError(404, `Website ${websiteId} not found`);
    }
    return convertResourceDates(snapshot.data() as Website) as Website;
  }
  /**
   * Add a website
   * @param {Website} website - The website to add.
   * @return {Promise<Website>} The website.
   */
  async add(website: Website): Promise<Website> {
    const ref = this.client.collection(ResourceName.Websites).doc();
    website.id = ref.id;
    website.createdAt = new Date();
    await ref.set(website);
    return website;
  }
  /**
   * Delete a message from a session.
   * @param {string} websiteId
   */
  async delete(
    websiteId: string): Promise<void> {
    const ref = this.client.collection(ResourceName.Websites).doc(websiteId);
    await ref.delete();
  }
  /**
   * List all messages in a session.
   * @param {string} websiteId
   */
  async list(): Promise<Website[]> {
    const ref = this.client.collection(ResourceName.Websites);
    const snapshot = await ref.get();
    const websites = snapshot.docs.map((doc) => {
      return convertResourceDates(doc.data() as Website) as Website;
    });
    return websites;
  }
}
