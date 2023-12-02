export type Metadata = Record<string, string | number | boolean>;

export interface Document {
  id: string;
  metadata: Metadata;
  content: string;
}

export interface ThreadLink {
  prefix: string;
  title: string;
  date: string;
  url: string;
}

export interface Thread {
  id: number;
  offset: number;
  title: string;
  date: string;
  content: string;
  url: string;
  imageUrls: string[];
}
export interface CrawlConfig {
  minId: number;
  maxId: number;
  maxRetry: number;
  maxContentLength: number;
  maxRecursionDepth: number;
  collectionName: string;
}


