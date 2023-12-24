"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlThreads = void 0;
/* eslint-disable no-multi-str */
const puppeteer_1 = require("puppeteer");
// import {ThreadLink, Thread} from "./model";
const model_1 = require("./model");
const firebase_functions_1 = require("firebase-functions");
const ocr_1 = require("./ocr");
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
        let contentImageTags = [];
        try {
            contentImageTags = await page.$$eval("img", (elements) => {
                return elements.filter(
                // eslint-disable-next-line max-len
                (e) => e.src.startsWith("https://startup.hanyang.ac.kr/api/resource/BOARD_CONTENT_IMG"))
                    .map((e) => {
                    return e.getAttribute("src");
                });
            });
            if (contentImageTags.length > 0) {
                firebase_functions_1.logger.debug(`Extracted ${contentImageTags.length} image urls\
          from ${url}.`);
                firebase_functions_1.logger.debug(`First image url: ${contentImageTags[0]}`);
            }
        }
        catch (e) {
            firebase_functions_1.logger.warn(`Failed to extract image urls: ${e}`);
            contentImageTags = [];
        }
        const imageUrls = contentImageTags.filter((v) => v);
        const id = extractIdFromUrl(url);
        if (!id) {
            throw new Error(`Failed to extract id from ${url}`);
        }
        await page.close();
        return {
            id: id,
            type: model_1.ThreadType.text,
            url: url,
            offset: 0,
            title: titleAndDate.title,
            date: titleAndDate.date,
            content: ckContentTextsConcatenated,
            imageUrls: imageUrls,
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
 * @param {number} maxOCRRetry
 * @return {Promise<Thread[]>} threads crawled.
 */
async function crawlThreads(minId, maxId, maxRetry, maxOCRRetry) {
    const browser = await puppeteer_1.default.launch({
        headless: "new",
    });
    const links = Array.from({ length: maxId - minId + 1 }, (_, i) => i + minId)
        .map((id) => `https://startup.hanyang.ac.kr/board/notice/view/${id}?boardName=notice`);
    try {
        firebase_functions_1.logger.debug(`Start crawling ${links.length} links.`);
        const threads = await Promise.all(links.map(async (v) => {
            let thread = null;
            let error = null;
            for (let i = 0; i < maxRetry; i++) {
                try {
                    thread = await extractThread(browser, v);
                    return thread;
                }
                catch (e) {
                    if (!(e instanceof Error)) {
                        throw e;
                    }
                    else {
                        error = e;
                    }
                    firebase_functions_1.logger.warn(`Failed to extract thread from ${v}, \
          retrying ${i + 1} / ${maxRetry} times.`);
                    continue;
                }
            }
            const err = error;
            firebase_functions_1.logger.error(`Failed to extract thread from ${v} after ${maxRetry} retries,\
         error stack: ${err.stack}`);
            throw err;
            return null;
        }).filter((v) => v !== null));
        const ocrThreads = await Promise.all(threads.map(async (thread) => ({
            id: thread.id,
            type: model_1.ThreadType.ocr,
            offset: 0,
            title: thread.title,
            date: thread.date,
            url: thread.url,
            imageUrls: thread.imageUrls,
            content: (await Promise.all(thread.imageUrls.map(async (u) => {
                for (let i = 0; i < maxOCRRetry; i++) {
                    try {
                        const text = await (0, ocr_1.extractTextFromImage)(u);
                        firebase_functions_1.logger.debug(`Extracted text from ${u}: ${text.slice(0, 16)}...`);
                        return text;
                    }
                    catch (error) {
                        firebase_functions_1.logger.warn(`Failed to extract fullTextAnnotation from ${u}, \
              retrying ${i + 1} / ${maxOCRRetry} times, error: ${error}`);
                        continue;
                    }
                }
                throw new Error(`Failed to extract texts from ${u} \
          after ${maxOCRRetry} retries.`);
            }))).join(" "),
        })));
        await browser.close();
        return [...threads, ...ocrThreads];
    }
    catch (e) {
        await browser.close();
        throw e;
    }
}
exports.crawlThreads = crawlThreads;
//# sourceMappingURL=crawl.js.map