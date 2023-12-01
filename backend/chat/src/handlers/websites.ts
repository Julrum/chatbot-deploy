import {Request, Response} from "express";
import {websiteCollection, Website} from "../resources/websites";
import {HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";
/**
 * Fill optional fields of a website
 * @param {Website} website
 * @return {Website}
 */
function fillWebsiteOptionalFields(website: Website) : Website {
  website.imageUrl ??= "https://www.hanyang.ac.kr/html-repositories/images/custom/introduction/img_hy0104_02_0102.png";
  website.primaryColor ??= "#000000";
  website.secondaryColor ??= "#ffffff";
  // eslint-disable-next-line no-multi-str
  website.disclaimer ??= "AI 챗봇은 방문자 분들께서 우리 학부 웹사이트를 보다 편리하게 \
이용하실 수 있도록 도와드립니다. \
하지만 AI 챗봇이 우리 학부의 공식 정보와 다른 답변을 드리는 경우도 있으니,\
보다 정확한 정보는 인용된 웹사이트나 담당자 분께 문의하여 주시기 바랍니다.";
  return website;
}

export const getWebsite = async (req: Request, res: Response) => {
  const websiteId = req.params.website_id;
  try {
    const website = await websiteCollection.get(websiteId);
    const filledWebsite = fillWebsiteOptionalFields(website);
    res.status(200).send(filledWebsite);
  } catch (error) {
    if (error instanceof HttpsError) {
      logger.error(`HTTPS error: ${error.message}, \
      error code = ${error.httpErrorCode}`);
      res.status(error.httpErrorCode.status).send(error.message);
      return;
    } else {
      logger.error(`Non-HTTPS error: ${JSON.stringify(error)}, \
      error code = 500`);
      res.status(500).send(JSON.stringify(error));
    }
  }
};

export const postWebsite = async (req: Request, res: Response) => {
  const website: Website = req.body;
  if (!website.name) {
    res.status(400).send("Website name is required");
    return;
  }
  if (!website.url) {
    res.status(400).send("Website URL is required");
    return;
  }
  if (!website.description) {
    res.status(400).send("Website description is required");
    return;
  }
  const filledWebsite = fillWebsiteOptionalFields(website);
  const newWebsite = await websiteCollection.add(filledWebsite);
  res.status(200).send(newWebsite);
};

export const listWebsites = async (req: Request, res: Response) => {
  const fetchedWebsites = await websiteCollection.list();
  const websites = fetchedWebsites.map(
    (website) => fillWebsiteOptionalFields(website));
  res.status(200).send(websites);
};

export const deleteWebsite = async (req: Request, res: Response) => {
  const websiteId = req.params.website_id;
  if (!websiteId) {
    res.status(400).send("Website ID is required");
    return;
  }
  await websiteCollection.delete(websiteId);
  res.status(200).send("Website deleted");
};
