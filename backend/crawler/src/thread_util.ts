import {Thread} from "./model";

/**
 * @param {Thread} thread
 * @param {number} maxContentLength
 * @return {Thread[]} splitted notification threads.
 */
function splitThreadByContentLength(
  thread: Thread, maxContentLength: number): Thread[] {
  const content = thread.content;
  const splittedContents: string[] = [];
  for (let i = 0; i < content.length; i += maxContentLength) {
    const end = Math.min(i + maxContentLength, content.length);
    const splitContent = content.slice(i, end);
    splittedContents.push(splitContent);
  }
  const splittedNotificationThreads = splittedContents.map((v, i) => ({
    id: thread.id,
    date: thread.date,
    offset: i * maxContentLength,
    title: thread.title,
    content: v,
    url: thread.url,
    imageUrls: thread.imageUrls,
  } as Thread));
  return splittedNotificationThreads;
}

/**
 * @param {Thread[]} threads
 * @param {number} maxContentLength
 * @return {Thread[]} splitted notification threads.
 */
export function splitThreadsByContentLength(
  threads: Thread[], maxContentLength: number): Thread[] {
  const splittedThreads: Thread[] = [];
  for (const thread of threads) {
    const splittedThreads = splitThreadByContentLength(
      thread, maxContentLength);
    splittedThreads.push(...splittedThreads);
  }
  return splittedThreads;
}
