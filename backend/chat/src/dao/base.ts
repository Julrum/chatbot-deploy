import {BaseChatResource} from "@orca.ai/pulse";
import * as admin from "firebase-admin";

/**
 * Base class for all DAOs.
 * @class
 * @abstract
 * @category DAO
 * @hideconstructor
 * @property {FirebaseFirestore.Firestore} client - The Firestore client
 */
export abstract class BaseChatDAO<T extends BaseChatResource> {
  client: FirebaseFirestore.Firestore;
  /**
   * The Firestore client constructor.
   * @type {FirebaseFirestore.Firestore}
   */
  constructor() {
    this.client = admin.firestore();
  }
  abstract get(...identifiers: string[]): Promise<T>;
  abstract add(resource: T, ...identifiers: string[]): Promise<T>;
  abstract delete(...identifiers: string[]): Promise<void>;
  abstract list(...identifiers: string[]): Promise<T[]>;
}
