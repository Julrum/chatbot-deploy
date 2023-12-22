import {Request, Response} from "express";
import {sendError} from "../util/error-handler";
import {logger} from "firebase-functions/v2";
import {SessionDAO} from "../dao/sessions";
import {StringMessage} from "@orca.ai/pulse";

export const getSession = async (req: Request, res: Response) => {
  const websiteId = req.params.websiteId;
  const sessionId = req.params.sessionId;
  const dao = new SessionDAO();
  try {
    const session = await dao.get(websiteId, sessionId);
    res.status(200).send(session);
  } catch (error) {
    sendError({
      res,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
  }
};

export const postSession = async (req: Request, res: Response) => {
  const websiteId = req.params.websiteId;
  const dao = new SessionDAO();
  try {
    const newSession = await dao.add(req.body, websiteId);
    res.status(200).send(newSession);
  } catch (error) {
    sendError({
      res,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
  }
};

export const listSessions = async (req: Request, res: Response) => {
  const websiteId = req.params.websiteId;
  const dao = new SessionDAO();
  try {
    const sessions = await dao.list(websiteId);
    res.status(200).send(sessions);
  } catch (error) {
    sendError({
      res,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  const websiteId = req.params.websiteId;
  const sessionId = req.params.sessionId;
  const dao = new SessionDAO();
  try {
    await dao.delete(websiteId, sessionId);
    res.status(200).send({
      message: `Session ${sessionId} deleted`,
    } as StringMessage);
  } catch (error) {
    sendError({
      res,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
  }
};
