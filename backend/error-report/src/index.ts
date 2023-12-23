import * as admin from "firebase-admin";
import cors from "cors";
import express from "express";
import * as functions from "firebase-functions/v2/https";
import {PingResponse, ResourceName, StringMessage} from "@orca.ai/pulse";
import { ErrorReport } from "@orca.ai/pulse";
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

app.post("/report", async (req, res) => {
  const errorReport = req.body as ErrorReport;
  if (!errorReport) {
    res.status(400).send({
      message: "Bad request, request body is empty",
    } as StringMessage);
    return;
  }
  if (!errorReport.error) {
    res.status(400).send({
      message: "Bad request, error field is empty",
    } as StringMessage);
    return;
  }
  console.debug("errorReport", errorReport);
  const db = admin.firestore();
  const docRef = db.collection(ResourceName.ErrorReports).doc();
  const e = {
    ...errorReport,
    id: docRef.id,
    createdAt: new Date(),
  } as ErrorReport;
  try {
    await docRef.set(e);
  } catch (error) {
    res.status(500).send({
      message: "Internal server error, failed to save error report in Firestore",
    } as StringMessage);
    return;
  }
  res.status(200).send(JSON.stringify(e));
});

config.listen(app);
export const errorReport = functions.onRequest(app);
