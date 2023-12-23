/* eslint-disable max-len */
import * as admin from "firebase-admin";
import cors from "cors";
import express from "express";
import * as functions from "firebase-functions/v2/https";
import {PingResponse, ResourceName, StringMessage} from "@orca.ai/pulse";
import {LikeMessage} from "@orca.ai/pulse";
import { config } from "./configs/config";

admin.initializeApp();
export const app = express();

app.use(cors({origin: true}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get("/ping", (_, res) => {
  res.status(200).send({
    message: "pong",
    timestamp: new Date().toISOString(),
  } as PingResponse);
});

app.post("/", async (req, res) => {
  const likeMessage = req.body as LikeMessage;
  if (!likeMessage) {
    res.status(400).send({
      message: "Bad Request, missing body",
    } as StringMessage);
    return;
  }
  if (!likeMessage.websiteId 
    || !likeMessage.sessionId 
    || !likeMessage.like 
    || !likeMessage.comment) {
    res.status(400).send({
      message: `Missing required fields, got: ${JSON.stringify(likeMessage)}`
    } as StringMessage);
    return;
  }
  if (likeMessage.id !== undefined || likeMessage.createdAt !== undefined) {
    res.status(400).send({
      message: `Cannot set id or createdAt in client, got: ${JSON.stringify(likeMessage)}`
    } as StringMessage);
    return;
  }

  const db = admin.firestore();
  const likeRef = db.collection(ResourceName.Likes).doc();
  const likeMessageToSave = {
    ...likeMessage,
    id: likeRef.id,
    createdAt: new Date().toISOString(),
  };
  try {
    await likeRef.set(likeMessageToSave);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: `Error writing to FireStore: ${error}`,
    } as StringMessage);
    return;
  }
  res.status(200).send(likeMessageToSave);
});

config.listen(app);
export const like = functions.onRequest(app);