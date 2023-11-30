import {Request, Response} from "express";
import {websiteCollection, Website} from "../resources/websites";
import {HttpsError} from "firebase-functions/v2/https";

export const getWebsite = async (req: Request, res: Response) => {
  const websiteId = req.params.website_id;
  try {
    const website = await websiteCollection.get(websiteId);
    res.status(200).send(website);
  } catch (error) {
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).send(error.message);
      return;
    }
    res.status(500).send(JSON.stringify(error));
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
  const newWebsite = await websiteCollection.add(website);
  res.status(200).send(newWebsite);
};

export const listWebsites = async (req: Request, res: Response) => {
  const websites = await websiteCollection.list();
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
