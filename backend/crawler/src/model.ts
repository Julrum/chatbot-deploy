export interface ThreadLink {
  prefix: string;
  title: string;
  date: string;
  url: string;
}
export enum ThreadType {
  text = "text",
  ocr = "ocr",
}

export interface Thread {
  id: number;
  type: ThreadType;
  offset: number;
  title: string;
  date: string;
  content: string;
  url: string;
  imageUrls: string[];
}
