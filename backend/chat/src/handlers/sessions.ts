import {Request, Response} from "express";
import {sessionCollection} from "../resources/sessions";
import {HttpsError} from "firebase-functions/v2/https";

export const getSession = async (req: Request, res: Response) => {
  const websiteId = req.params.website_id;
  const sessionId = req.params.session_id;
  try {
    const session = await sessionCollection.get(websiteId, sessionId);
    res.status(200).send(session);
  } catch (error) {
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).send(error.message);
      return;
    }
    res.status(500).send(JSON.stringify(error));
  }
};

export const postSession = async (req: Request, res: Response) => {
  const websiteId = req.params.website_id;
  try {
    const newSession = await sessionCollection.add(req.body, websiteId);
    res.status(200).send(newSession);
  } catch (error) {
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).send(error.message);
      return;
    }
    res.status(500).send(JSON.stringify(error));
  }
};

export const listSessions = async (req: Request, res: Response) => {
  const websiteId = req.params.website_id;
  const sessions = await sessionCollection.list(websiteId);
  res.status(200).send(sessions);
};

export const deleteSession = async (req: Request, res: Response) => {
  const websiteId = req.params.website_id;
  const sessionId = req.params.session_id;
  await sessionCollection.delete(websiteId, sessionId);
  res.status(200).send();
};
