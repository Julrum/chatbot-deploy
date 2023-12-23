/* eslint-disable max-len */
import * as admin from "firebase-admin";
import cors from "cors";
import express from "express";
import * as functions from "firebase-functions/v2/https";
import {PingResponse, ResourceName, StringMessage} from "@orca.ai/pulse";
import {LikeMessage} from "@orca.ai/pulse";

admin.initializeApp();
export const app = express();

app.use(cors({origin: true}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get("/ping", (req, res) => {
  res.status(200).send({
    message: "pong",
    timestamp: new Date().toISOString(),
  } as PingResponse);
});

app.post("/like", async (req, res) => {
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
    || !likeMessage.createdAt
    || !likeMessage.comment) {
    res.status(400).send({
      message: `Missing required fields, got: ${JSON.stringify(likeMessage)}`
    } as StringMessage);
    return;
  }

  const db = admin.firestore();
  const likeRef = db.collection(ResourceName.Likes).doc();
  try {
    await likeRef.set(likeMessage);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: `Error writing to FireStore: ${error}`,
    } as StringMessage);
    return;
  }
  res.status(200).send({
    message: "success",
  } as StringMessage);
});

export const like = functions.onRequest(app);