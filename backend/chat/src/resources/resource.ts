import {logger} from "firebase-functions/v2";

export interface Resource {
    id: string | null;
    createdAt: Date | null;
    deletedAt: Date | null;
}

export enum ResourceName {
    Websites = "websites",
    Sessions = "sessions",
    Messages = "messages",
    Prompts = "prompts"
}
export interface Collection<T> {
    get: (...ids: string[]) => Promise<T>;
    add: (resource: T, ...ids: string[]) => Promise<T>;
    delete: (...ids: string[]) => Promise<void>;
    list: (...ids: string[]) => Promise<T[]>;
}

interface FirebaseTimestamp {
    _seconds: number;
    _nanoseconds: number;
}

/**
 * Ensures that the given datetime is a Date object, no matter
 * whether it was a Date object or a firebase timestamp.
 * @param {Date | FirebaseTimestamp | null} date
 * @return {Date}
 */
function dateOf(date: Date | FirebaseTimestamp | string | null): Date | null {
  if (date === null || date === undefined) {
    return null;
  }
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === "string") {
    return new Date(date);
  }
  const timestamp = date as FirebaseTimestamp;
  if (!timestamp._seconds || !timestamp._nanoseconds) {
    throw new Error(
      `Failed to convert the following object into Date: ${date}`);
  }
  return new Date(
    timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
}

/**
 * Ensures that the given resource object's createdAt and deletedAt
 * fields are Date objects, no matter whether they were Date objects
 * or firebase timestamps.
 * @param {Resource} resource
 * @return {Resource}
 */
export function convertResourceDates(resource: Resource): Resource {
  let createdAt; let deletedAt;
  try {
    createdAt = dateOf(resource.createdAt);
    deletedAt = dateOf(resource.deletedAt);
  } catch (error) {
    logger.error(
      `Error converting date object ${{createdAt, deletedAt}},\
       error: ${error}`);
    throw error;
  }
  return {
    ...resource,
    createdAt,
    deletedAt,
  };
}


