/* eslint-disable no-multi-str */
import puppeteer, {Browser, ProtocolError} from "puppeteer";
// import {ThreadLink, Thread} from "./model";
import {Thread, ThreadType} from "./model";
import {logger} from "firebase-functions";
import {extractTextFromImage} from "./ocr";

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
 * @param {Browser} browser
 * @param {string} url url of the thread.
 * @return {Promise<Thread | null>} thread extracted from the link,
 * or null if failed to extract.
 */
async function extractThread(
  browser: Browser, url: string
): Promise<Thread | null> {
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
    const titleAndDateElement = await page.$(".board_topTitleArea__FYnYL");
    if (!titleAndDateElement) {
      throw new Error(
        `Failed to find CSS selector: 
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

    let contentImageTags: (string | null)[] = [];
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
        logger.debug(`Extracted ${contentImageTags.length} image urls\
          from ${url}.`);
        logger.debug(`First image url: ${contentImageTags[0]}`);
      }
    } catch (e) {
      logger.warn(`Failed to extract image urls: ${e}`);
      contentImageTags = [];
    }
    const imageUrls = contentImageTags.filter((v) => v) as string[];

    const id = extractIdFromUrl(url);
    if (!id) {
      throw new Error(`Failed to extract id from ${url}`);
    }
    await page.close();
    return {
      id: id,
      type: ThreadType.text,
      url: url,
      offset: 0,
      title: titleAndDate.title,
      date: titleAndDate.date,
      content: ckContentTextsConcatenated,
      imageUrls: imageUrls,
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
 * @param {number} minId
 * @param {number} maxId
 * @param {number} maxRetry
 * @param {number} maxOCRRetry
 * @return {Promise<Thread[]>} threads crawled.
 */
export async function crawlThreads(
  minId: number, maxId: number,
  maxRetry: number, maxOCRRetry: number): Promise<Thread[]> {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const links = Array.from({length: maxId - minId + 1}, (_, i) => i + minId)
    .map((id) => `https://startup.hanyang.ac.kr/board/notice/view/${id}?boardName=notice`);
  try {
    logger.debug(`Start crawling ${links.length} links.`);
    const threads = await Promise.all(links.map(async (v) => {
      let thread: Thread | null = null;
      let error: Error | null = null;
      for (let i = 0; i < maxRetry; i++) {
        try {
          thread = await extractThread(browser, v);
          return thread;
        } catch (e) {
          if (!(e instanceof Error)) {
            throw e;
          } else {
            error = e;
          }
          logger.warn(`Failed to extract thread from ${v}, \
          retrying ${i + 1} / ${maxRetry} times.`);
          continue;
        }
      }
      const err = error as Error;
      logger.error(
        `Failed to extract thread from ${v} after ${maxRetry} retries,\
         error stack: ${err.stack}`);
      throw err;
      return null;
    }).filter((v) => v !== null)) as Thread[];
    const ocrThreads = await Promise.all(threads.map(async (thread) => ({
      id: thread.id,
      type: ThreadType.ocr,
      offset: 0,
      title: thread.title,
      date: thread.date,
      url: thread.url,
      imageUrls: thread.imageUrls,
      content: (await Promise.all(thread.imageUrls.map(
        async (u) => {
          for (let i = 0; i < maxOCRRetry; i++) {
            try {
              const text = await extractTextFromImage(u);
              logger.debug(`Extracted text from ${u}: ${text.slice(0, 16)}...`);
              return text;
            } catch (error) {
              logger.warn(`Failed to extract fullTextAnnotation from ${u}, \
              retrying ${i + 1} / ${maxOCRRetry} times, error: ${error}`);
              continue;
            }
          }
          throw new Error(`Failed to extract texts from ${u} \
          after ${maxOCRRetry} retries.`);
        }
      ))).join(" "),
    }))) as Thread[];
    await browser.close();
    return [...threads, ...ocrThreads];
  } catch (e) {
    await browser.close();
    throw e;
  }
}
