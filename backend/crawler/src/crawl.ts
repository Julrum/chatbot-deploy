/* eslint-disable no-multi-str */
import puppeteer, {Browser, ProtocolError} from "puppeteer";
import {ThreadLink, Thread} from "./model";
import {logger} from "firebase-functions";

/**
 *
 * @param {string} url url of the thread.
 * @return {number | null} id of the thread, or null if failed to extract id.
 */
function extractIdFromUrl(url: string): number | null {
  const regex = /\/view\/(\d+)/;
  const match = url.match(regex);
  if (!match) {
    logger.info(`Failed to match regex: ${regex}`);
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
async function extractLinksInBoard(
  browser: Browser, url: string): Promise<ThreadLink[]> {
  const page = await browser.newPage();
  try {
    // waits until the network is idle
    // (no more than 2 connections for at least 500 ms).
    await page.goto(url, {waitUntil: "networkidle2"});
  } catch (e) {
    if (e instanceof ProtocolError) {
      await page.close();
      throw new Error(
        `Failed to navigate to ${url}, exiting loop.`);
    }
  }
  // Now, the page is fully loaded,
  // and you can select elements as in a regular browser.
  try {
    const threadLinks = await page.evaluate(() => {
      // You can use regular DOM methods here.
      const tbodys = document.querySelector(
        "#wrap > div.container > section > div > table > tbody",
      )?.children;
      if (!tbodys) {
        throw new Error(
          `Failed to find CSS selector: 
          ${"#wrap > div.container > section > div > table > tbody"}`);
      }
      return Array.from(tbodys).map((v) => {
        const prefix = v.children[0]?.innerHTML;
        const title = v.children[1]?.children[0].innerHTML;
        const dateTimeText = v.children[2]?.innerHTML;
        const standardDateTimeText = dateTimeText.replace(/\./g, "-").trim();
        const date = new Date(standardDateTimeText).toISOString();
        const urlPath = v.children[1]?.children[0].getAttribute("href");
        const url = `https://startup.hanyang.ac.kr${urlPath}`;
        return {prefix, title, date, url} as ThreadLink;
      });
    });
    await page.close();
    return threadLinks;
  } catch (e) {
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
async function extractThread(
  browser: Browser, link: ThreadLink,
): Promise<Thread | null> {
  const url = link.url;
  const page = await browser.newPage();
  try {
    // waits until the network is idle
    // (no more than 2 connections for at least 500 ms).
    await page.goto(url, {waitUntil: "networkidle2"});
  } catch (e) {
    if (e instanceof ProtocolError) {
      await page.close();
      throw new Error(
        `Failed to navigate to ${url}, exiting loop.`);
    }
  }
  try {
    const titleAndDate = await page.evaluate(async () => {
      const titleElements = await document.querySelectorAll(
        "#wrap > div.container > section > div > \
        div > div");
      if (titleElements.length == 0) {
        throw new Error(
          `Failed to find CSS selector: 
          ${"#wrap > div.container > section > div > \
          div > div.board_topTitleArea__FYnYL"}`);
      }
      const titleAndDateElement = titleElements[0];
      return {
        title: titleAndDateElement.children[0].innerHTML,
        date: titleAndDateElement.children[1].innerHTML,
      };
    });
    const ckContentTexts = await page.$$eval(".ck-content", (elements) =>
      elements.map((element) => {
        const recursivelyGetTexts = (
          node: Node, curDepth: number, maxDepth: number): string[] => {
          if (curDepth >= maxDepth) {
            // logger.warn(`Reached max depth ${maxDepth}, exiting recursion.`);
            return [];
          }
          const children = node.childNodes;
          if (children.length == 0) {
            return [];
          }
          let texts: string[] = [];
          for (const child of children) {
            if (child.nodeType === Node.TEXT_NODE) {
              if (child.textContent) {
                texts.push(child.textContent);
              }
            } else {
              const childTexts = recursivelyGetTexts(
                child, curDepth + 1, maxDepth);
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
    } as Thread;
  } catch (e) {
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
 * @param {Browser} browser puppeteer browser instance.
 * @param {number} maxPage maximum number of pages to crawl.
 * @param {number} maxRetry maximum number of retries.
 * @param {Date} earliestDate earliest date to crawl.
 * @return {Promise<ThreadLink[]>} thread links in the board.
 */
async function extractLinks(
  {browser, maxPage, startDate, endDate}: {
    browser: Browser; maxPage: number;
    startDate: Date; endDate: Date;
  }): Promise<ThreadLink[]> {
  const allLinks: ThreadLink[] = [];
  let reachedStartDate = false;
  for (let currentPage = 1;
    !reachedStartDate && currentPage <= maxPage;
    currentPage++) {
    const url = `https://startup.hanyang.ac.kr/board/notice/list?boardName=notice&page=${currentPage}`;
    const links = await extractLinksInBoard(browser, url);
    if (links.length == 0) {
      logger.info(`No more links in page ${currentPage}, exiting loop.`);
      break;
    }
    // Since the BBS is sorted by date in descending order,
    // we first filter out links before the end date,
    // then filter out links after the start date.
    const sortedLinks = links.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const linksBeforeEndDate = sortedLinks.filter(
      (v) => new Date(v.date) <= endDate);
    const linksAfterStartDate = linksBeforeEndDate.filter(
      (v) => new Date(v.date) >= startDate);
    reachedStartDate = linksAfterStartDate.length < linksBeforeEndDate.length;
    allLinks.push(...linksAfterStartDate);
  }
  return allLinks;
}

/**
 *
 * @param {number} maxPage maximum number of pages to crawl.
 * @return {Promise<Thread[]>} threads crawled
 */
export async function crawlThreads({
  maxPage, startDate, endDate}: {
    maxPage : number, startDate: Date, endDate: Date,
  }) : Promise<Thread[]> {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  try {
    const links = await extractLinks({
      browser, maxPage, startDate, endDate});
    const threads = await Promise.all(links.map(async (v) =>
      extractThread(browser, v)
    ).filter((v) => v !== null)) as Thread[];
    await browser.close();
    return threads;
  } catch (e) {
    await browser.close();
    throw e;
  }
}
