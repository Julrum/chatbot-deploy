"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitThreadsByContentLength = void 0;
/**
 * @param {Thread} thread
 * @param {number} maxContentLength
 * @return {Thread[]} splitted notification threads.
 */
function splitThreadByContentLength(thread, maxContentLength) {
    const content = thread.content;
    const splittedContents = [];
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
    }));
    return splittedNotificationThreads;
}
/**
 * @param {Thread[]} threads
 * @param {number} maxContentLength
 * @return {Thread[]} splitted notification threads.
 */
function splitThreadsByContentLength(threads, maxContentLength) {
    const splittedThreads = [];
    for (const thread of threads) {
        const splittedThreads = splitThreadByContentLength(thread, maxContentLength);
        splittedThreads.push(...splittedThreads);
    }
    return splittedThreads;
}
exports.splitThreadsByContentLength = splitThreadsByContentLength;
//# sourceMappingURL=thread_util.js.map