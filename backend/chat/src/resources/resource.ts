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

