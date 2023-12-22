import {Request, Response} from "express";
import {WebsiteDAO} from "../dao/websites";
import {StringMessage, Website} from "@orca.ai/pulse";
import {HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";
import {sendError} from "../util/error-handler";
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
  const websiteId = req.params.websiteId;
  if (!websiteId) {
    res.status(400).send({message: "Website ID is required"} as StringMessage);
    return;
  }
  const dao = new WebsiteDAO();
  try {
    const website = await dao.get(websiteId);
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
    res.status(400).send({
      message: "Website name is required"} as StringMessage);
    return;
  }
  if (!website.url) {
    res.status(400).send({
      message: "Website URL is required"} as StringMessage);
    return;
  }
  if (!website.description) {
    res.status(400).send({
      message: "Website description is required"} as StringMessage);
    return;
  }
  const filledWebsite = fillWebsiteOptionalFields(website);
  const dao = new WebsiteDAO();
  try {
    const newWebsite = await dao.add(filledWebsite);
    res.status(200).send(newWebsite);
  } catch (error) {
    sendError({
      res,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
  }
};

export const listWebsites = async (req: Request, res: Response) => {
  const dao = new WebsiteDAO();
  try {
    const fetchedWebsites = await dao.list();
    const websites = fetchedWebsites.map(
      (website) => fillWebsiteOptionalFields(website));
    res.status(200).send(websites);
  } catch (error) {
    sendError({
      res,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
  }
};

export const deleteWebsite = async (req: Request, res: Response) => {
  const websiteId = req.params.websiteId;
  if (!websiteId) {
    res.status(400).send({message: "Website ID is required"} as StringMessage);
    return;
  }
  const dao = new WebsiteDAO();
  try {
    await dao.delete(websiteId);
    res.status(200).send({message: "Website deleted"} as StringMessage);
  } catch (error) {
    sendError({
      res,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
  }
};
