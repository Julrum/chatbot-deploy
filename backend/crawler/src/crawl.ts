import puppeteer, {Browser, ProtocolError} from "puppeteer";
import {ThreadLink, Thread} from "./model";

/**
 *
 * @param {string} url url of the thread.
 * @return {number | null} id of the thread, or null if failed to extract id.
 */
function extractIdFromUrl(url: string): number | null {
  const regex = /\/view\/(\d+)/;
  const match = url.match(regex);
  if (!match) {
    console.log(`Failed to match regex: ${regex}`);
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
 * @param {number} maxRetry maximum number of retries.
 * @return {Promise<ThreadLink[]>} thread links in the board.
 */
async function extractLinksInBoard(
  browser: Browser, url: string, maxRetry: number): Promise<ThreadLink[]> {
  const page = await browser.newPage();
  try {
    // waits until the network is idle
    // (no more than 2 connections for at least 500 ms).
    await page.goto(url, {waitUntil: "networkidle2"});
  } catch (e) {
    if (e instanceof ProtocolError) {
      console.log(`Failed to navigate to ${url}, exiting loop.`);
      await page.close();
      return [];
    }
  }
  // Now, the page is fully loaded,
  // and you can select elements as in a regular browser.
  for (let i = 0; i < maxRetry; i++) {
    const threadLinks = await page.evaluate(() => {
      // You can use regular DOM methods here.
      const tbodys = document.querySelector(
        "#wrap > div.container > section > div > table > tbody",
      )?.children;
      if (!tbodys) {
        return [];
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
    if (threadLinks.length > 0) {
      await page.close();
      return threadLinks;
    }
  }
  await page.close();
  return [];
}

/**
 *
 * @param {Browser} browser
 * @param {ThreadLink} link
 * @return {Promise<Thread | null>} thread extracted from the link,
 * or null if failed to extract.
 */
async function extractThread(
  browser: Browser, link: ThreadLink): Promise<Thread | null> {
  const url = link.url;
  const page = await browser.newPage();
  try {
    // waits until the network is idle
    // (no more than 2 connections for at least 500 ms).
    await page.goto(url, {waitUntil: "networkidle2"});
  } catch (e) {
    if (e instanceof ProtocolError) {
      console.log(`Failed to navigate to ${url}, exiting loop.`);
      await page.close();
      return null;
    }
  }
  const extractedThread = await page.evaluate(() => {
    const pageContent = document.querySelector(
      "#wrap > div.container > section > div > div"
    );
    if (!pageContent) {
      return null;
    }
    const metadata = pageContent.querySelectorAll("div").item(0);
    const title = metadata?.children[0].innerHTML;
    const dateTimeString = metadata?.children[1].innerHTML;
    const standardDateTimeString = dateTimeString
      .replace(/\./g, "-").replace(" ", "T").trim();
    const date = new Date(standardDateTimeString).toISOString();
    const content = pageContent.querySelector("div > .ck-content");
    if (!content) {
      return null;
    }
    const paragraphs = content.querySelectorAll("p");
    const images = content.querySelectorAll("figure.image");
    const imageSources = Array.from(images)
      .map((v) => v.querySelector("img")?.getAttribute("src"));
    const validImageSources = imageSources.filter((v) => v !== null);
    const texts = Array.from(paragraphs).map((v) => {
      const txt = document.createElement("textarea");
      txt.innerHTML = v.innerHTML;
      const htmlTagsRemoved = txt.value.replace(/<[^>]*>?/gm, "");
      return htmlTagsRemoved;
    });
    const concatenatedText = texts.join(" ");

    return {
      offset: 0,
      title,
      date,
      content: concatenatedText,
      imageUrls: validImageSources,
    };
  });
  await page.close();
  if (!extractedThread ||
    extractedThread.title == null ||
    extractedThread.title == undefined ||
    extractedThread.content == undefined ||
    extractedThread.content == null
  ) {
    console.log(`Failed to extract thread from ${url}`);
    console.log(`Extracted thread: ${JSON.stringify(extractedThread)}`);
    return null;
  }
  const id = extractIdFromUrl(url);
  if (!id) {
    return null;
  }
  const thread = {
    id,
    url,
    ...extractedThread,
  } as Thread;
  return thread;
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
  {browser, maxPage, maxRetry, startDate, endDate}: {
    browser: Browser; maxPage: number; maxRetry: number;
    startDate: Date; endDate: Date;
  }): Promise<ThreadLink[]> {
  const allLinks: ThreadLink[] = [];
  let reachedStartDate = false;
  for (let currentPage = 1;
    !reachedStartDate && currentPage <= maxPage;
    currentPage++) {
    const url = `https://startup.hanyang.ac.kr/board/notice/list?boardName=notice&page=${currentPage}`;
    let currentTry = 0;
    for (currentTry = 0; currentTry < maxRetry; currentTry++) {
      const links = await extractLinksInBoard(browser, url, maxRetry);
      if (links.length == 0) {
        console.log(`Failed to extract links from page #${currentPage}, 
        retrying...(${currentTry} / ${maxRetry})`);
        continue;
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
    if (currentTry == maxRetry) {
      console.log(`Failed to extract links from page #${currentPage}, 
      reached max retry=${maxRetry}.`);
    }
  }
  return allLinks;
}

/**
 *
 * @param {number} maxPage maximum number of pages to crawl.
 * @param {number} maxRetry maximum number of retries.
 * @param {Date} earliestDate earliest date to crawl.
 * @return {Promise<Thread[]>} threads crawled
 */
export async function crawlThreads({
  maxPage, maxRetry, startDate, endDate}: {
    maxPage : number, maxRetry: number, startDate: Date, endDate: Date,
  }) : Promise<Thread[]> {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const links = await extractLinks({
    browser, maxPage, maxRetry, startDate, endDate});
  const threads = await Promise.all(links.map(async (v) =>
    extractThread(browser, v)).filter((v) => v !== null)) as Thread[];
  await browser.close();
  return threads;
}
