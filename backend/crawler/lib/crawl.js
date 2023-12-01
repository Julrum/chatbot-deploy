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
async function extractLinksInBoard(browser, url) {
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
    // Now, the page is fully loaded,
    // and you can select elements as in a regular browser.
    try {
        const threadLinks = await page.evaluate(() => {
            var _a;
            // You can use regular DOM methods here.
            const tbodys = (_a = document.querySelector("#wrap > div.container > section > div > table > tbody")) === null || _a === void 0 ? void 0 : _a.children;
            if (!tbodys) {
                throw new Error(`Failed to find CSS selector: 
          ${"#wrap > div.container > section > div > table > tbody"}`);
            }
            return Array.from(tbodys).map((v) => {
                var _a, _b, _c, _d;
                const prefix = (_a = v.children[0]) === null || _a === void 0 ? void 0 : _a.innerHTML;
                const title = (_b = v.children[1]) === null || _b === void 0 ? void 0 : _b.children[0].innerHTML;
                const dateTimeText = (_c = v.children[2]) === null || _c === void 0 ? void 0 : _c.innerHTML;
                const standardDateTimeText = dateTimeText.replace(/\./g, "-").trim();
                const date = new Date(standardDateTimeText).toISOString();
                const urlPath = (_d = v.children[1]) === null || _d === void 0 ? void 0 : _d.children[0].getAttribute("href");
                const url = `https://startup.hanyang.ac.kr${urlPath}`;
                return { prefix, title, date, url };
            });
        });
        await page.close();
        return threadLinks;
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
 * @param {Browser} browser
 * @param {ThreadLink} link
 * @param {number} maxRecursionDepth
 * @return {Promise<Thread | null>} thread extracted from the link,
 * or null if failed to extract.
 */
async function extractThread(browser, link) {
    const url = link.url;
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
        const titleAndDate = await page.$$eval("[class^=\"board_topTitleArea\"]", (elements) => {
            if (elements.length == 0) {
                throw new Error(`Failed to find CSS selector: 
          ${"#wrap > div.container > section > div > \
          div > div.board_topTitleArea__FYnYL"}`);
            }
            const titleElement = elements[0].children[0];
            const dateElement = elements[0].children[1];
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
 * @param {ThreadLink[]} links thread links in the board.
 * @param {Set<number>} idCache cache of ids.
 * @return {ThreadLink[]} thread links that are not in the cache
 */
function getOnlyUnseenThreads(links, idCache) {
    const parsedIds = links.map((v) => extractIdFromUrl(v.url));
    parsedIds.forEach((v, i) => {
        if (v === null) {
            throw new Error(`Failed to extract ids from ${links[i].url}`);
        }
    });
    const ids = parsedIds;
    const unseenIds = ids.filter((v) => !idCache.has(v));
    const unseenLinks = links.filter((v) => unseenIds.includes(extractIdFromUrl(v.url)));
    return unseenLinks;
}
/**
 *
 * @param {Browser} browser puppeteer browser instance.
 * @param {number} maxPage maximum number of pages to crawl.
 * @param {number} maxRetry maximum number of retries.
 * @param {Date} earliestDate earliest date to crawl.
 * @return {Promise<ThreadLink[]>} thread links in the board.
 */
async function extractLinks({ browser, maxPage, startDate, endDate }) {
    const allLinks = [];
    const idCache = new Set();
    for (let currentPage = 1; currentPage <= maxPage; currentPage++) {
        const url = `https://startup.hanyang.ac.kr/board/notice/list?boardName=notice&page=${currentPage}`;
        const links = await extractLinksInBoard(browser, url);
        const unseenLinks = getOnlyUnseenThreads(links, idCache);
        unseenLinks.forEach((v) => idCache.add(extractIdFromUrl(v.url)));
        // Since the BBS is sorted by date in descending order,
        // we first filter out links before the end date,
        // then filter out links after the start date.
        const sortedLinks = unseenLinks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const linksBeforeEndDate = sortedLinks.filter((v) => new Date(v.date) <= endDate);
        if (linksBeforeEndDate.length === 0) {
            firebase_functions_1.logger.debug("Not reached the end date, continuing.");
            continue;
        }
        const linksAfterStartDate = linksBeforeEndDate.filter((v) => new Date(v.date) >= startDate);
        allLinks.push(...linksAfterStartDate);
        firebase_functions_1.logger.debug(`sortedLinks.length=${sortedLinks.length} -> \
    linksBeforeEndDate.length=${linksBeforeEndDate.length} -> \
    linksAfterStartDate.length=${linksAfterStartDate.length}
    `);
        if (linksAfterStartDate.length < linksBeforeEndDate.length) {
            break;
        }
    }
    return allLinks;
}
/**
 *
 * @param {number} maxPage maximum number of pages to crawl.
 * @return {Promise<Thread[]>} threads crawled
 */
async function crawlThreads({ maxPage, startDate, endDate }) {
    const browser = await puppeteer_1.default.launch({
        headless: "new",
    });
    try {
        const links = await extractLinks({
            browser, maxPage, startDate, endDate
        });
        firebase_functions_1.logger.debug(`Extracted ${links.length} links.`);
        const threads = await Promise.all(links.map(async (v) => extractThread(browser, v)).filter((v) => v !== null));
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