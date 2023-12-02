"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlThreads = void 0;
/* eslint-disable no-multi-str */
const puppeteer_1 = require("puppeteer");
const firebase_functions_1 = require("firebase-functions");
/**
 *
 * @param {string} url url of the thread.
 * @return {number | null} id of the thread, or null if failed to extract id.
 */
function extractIdFromUrl(url) {
    const regex = /\/view\/(\d+)/;
    const match = url.match(regex);
    if (!match) {
        firebase_functions_1.logger.info(`Failed to match regex: ${regex}`);
        return null;
    }
    const id = parseInt(match[1]);
    if (isNaN(id)) {
        return null;
    }
    return id;
}
/**
 *
 * @param {Browser} browser puppeteer browser instance.
 * @param {string} url url of the board.
 * @return {Promise<ThreadLink[]>} thread links in the board.
 */
// async function extractLinksInBoard(
//   browser: Browser, url: string): Promise<ThreadLink[]> {
//   const page = await browser.newPage();
//   try {
//     // waits until the network is idle
//     // (no more than 2 connections for at least 500 ms).
//     await page.goto(url, {waitUntil: "networkidle2"});
//   } catch (e) {
//     if (e instanceof ProtocolError) {
//       await page.close();
//       throw new Error(
//         `Failed to navigate to ${url}, exiting loop.`);
//     }
//   }
//   // Now, the page is fully loaded,
//   // and you can select elements as in a regular browser.
//   try {
//     const threadLinks = await page.evaluate(() => {
//       // You can use regular DOM methods here.
//       const tbodys = document.querySelector(
//         "#wrap > div.container > section > div > table > tbody",
//       )?.children;
//       if (!tbodys) {
//         throw new Error(
//           `Failed to find CSS selector:
//           ${"#wrap > div.container > section > div > table > tbody"}`);
//       }
//       return Array.from(tbodys).map((v) => {
//         const prefix = v.children[0]?.innerHTML;
//         const title = v.children[1]?.children[0].innerHTML;
//         const dateTimeText = v.children[2]?.innerHTML;
//         const standardDateTimeText = dateTimeText.replace(/\./g, "-").trim();
//         const date = new Date(standardDateTimeText).toISOString();
//         const urlPath = v.children[1]?.children[0].getAttribute("href");
//         const url = `https://startup.hanyang.ac.kr${urlPath}`;
//         return {prefix, title, date, url} as ThreadLink;
//       });
//     });
//     await page.close();
//     return threadLinks;
//   } catch (e) {
//     await page.close();
//     if (!(e instanceof Error)) {
//       throw e;
//     }
//     throw new Error(JSON.stringify({
//       name: e.name,
//       message: e.message,
//       stack: e.stack,
//       url: url,
//     }));
//   }
// }
/**
 *
 * @param {Browser} browser
 * @param {string} url url of the thread.
 * @return {Promise<Thread | null>} thread extracted from the link,
 * or null if failed to extract.
 */
async function extractThread(browser, url) {
    const page = await browser.newPage();
    try {
        // waits until the network is idle
        // (no more than 2 connections for at least 500 ms).
        await page.goto(url, { waitUntil: "networkidle2" });
    }
    catch (e) {
        if (e instanceof puppeteer_1.ProtocolError) {
            await page.close();
            throw new Error(`Failed to navigate to ${url}, exiting loop.`);
        }
    }
    try {
        const titleAndDateElement = await page.$(".board_topTitleArea__FYnYL");
        if (!titleAndDateElement) {
            throw new Error(`Failed to find CSS selector: 
        ${"#wrap > div.container > section > div > \
        div > div.board_topTitleArea__FYnYL"}`);
        }
        const titleAndDate = await titleAndDateElement.evaluate((element) => {
            const titleElement = element.children[0];
            const dateElement = element.children[1];
            return {
                title: titleElement.innerHTML,
                date: dateElement.innerHTML,
            };
        });
        const ckContentTexts = await page.$$eval(".ck-content", (elements) => elements.map((element) => {
            const recursivelyGetTexts = (node, curDepth, maxDepth) => {
                if (curDepth >= maxDepth) {
                    // logger.warn(`Reached max depth ${maxDepth}, exiting recursion.`);
                    return [];
                }
                const children = node.childNodes;
                if (children.length == 0) {
                    return [];
                }
                let texts = [];
                for (const child of children) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        if (child.textContent) {
                            texts.push(child.textContent);
                        }
                    }
                    else {
                        const childTexts = recursivelyGetTexts(child, curDepth + 1, maxDepth);
                        texts = texts.concat(childTexts);
                    }
                }
                return texts;
            };
            return recursivelyGetTexts(element, 0, 2);
        }));
        const ckContentTextsConcatenated = ckContentTexts
            .map((v) => v.join(" "))
            .join(" ")
            .replace(/<[^>]*>?/gm, "");
        const id = extractIdFromUrl(url);
        if (!id) {
            throw new Error(`Failed to extract id from ${url}`);
        }
        await page.close();
        return {
            id: id,
            url: url,
            offset: 0,
            title: titleAndDate.title,
            date: titleAndDate.date,
            content: ckContentTextsConcatenated,
            imageUrls: [],
        };
    }
    catch (e) {
        await page.close();
        if (!(e instanceof Error)) {
            throw e;
        }
        throw new Error(JSON.stringify({
            name: e.name,
            message: e.message,
            stack: e.stack,
            url: url,
        }));
    }
}
/**
 *
 * @param {number} minId
 * @param {number} maxId
 * @param {number} maxRetry
 * @return {Promise<Thread[]>} threads crawled.
 */
async function crawlThreads(minId, maxId, maxRetry) {
    const browser = await puppeteer_1.default.launch({
        headless: "new",
    });
    const links = Array.from({ length: maxId - minId + 1 }, (_, i) => i + minId)
        .map((id) => `https://startup.hanyang.ac.kr/board/notice/view/${id}?boardName=notice`);
    try {
        firebase_functions_1.logger.debug(`Extracted ${links.length} links.`);
        const threads = await Promise.all(links.map(async (v) => {
            let thread = null;
            for (let i = 0; i < maxRetry; i++) {
                try {
                    thread = await extractThread(browser, v);
                    return thread;
                }
                catch (e) {
                    firebase_functions_1.logger.warn(`Failed to extract thread from ${v}, \
          retrying ${i + 1} / ${maxRetry} times.`);
                    continue;
                }
            }
            firebase_functions_1.logger.error(`Failed to extract thread from ${v} after ${maxRetry} retries.`);
            return null;
        }).filter((v) => v !== null));
        await browser.close();
        return threads;
    }
    catch (e) {
        await browser.close();
        throw e;
    }
}
exports.crawlThreads = crawlThreads;
//# sourceMappingURL=crawl.js.map