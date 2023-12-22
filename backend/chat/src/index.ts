/* eslint-disable max-len */
import * as admin from "firebase-admin";
import * as cors from "cors";
import * as express from "express";
import * as functions from "firebase-functions/v2/https";
import {ResourceName} from "@orca.ai/pulse";
import {
  getWebsite,
  postWebsite,
  listWebsites,
  deleteWebsite,
} from "./handlers/websites";
import {
  getSession,
  postSession,
  listSessions,
  deleteSession,
} from "./handlers/sessions";
import {getMessage,
  postMessage,
  listMessages,
  deleteMessage,
  getReply,
} from "./handlers/messages";

admin.initializeApp();
export const app = express();

app.use(cors({origin: true}));

app.get(`/${ResourceName.Websites}/:websiteId`, getWebsite);
app.post(`/${ResourceName.Websites}`, postWebsite);
app.get(`/${ResourceName.Websites}`, listWebsites);
app.delete(`/${ResourceName.Websites}/:websiteId`, deleteWebsite);

app.get(`/${ResourceName.Websites}/:websiteId/${ResourceName.Sessions}/:sessionId`, getSession);
app.post(`/${ResourceName.Websites}/:websiteId/${ResourceName.Sessions}`, postSession);
app.get(`/${ResourceName.Websites}/:websiteId/${ResourceName.Sessions}`, listSessions);
app.delete(`/${ResourceName.Websites}/:websiteId/${ResourceName.Sessions}/:sessionId`, deleteSession);

app.get(`/${ResourceName.Websites}/:websiteId/${ResourceName.Sessions}/:sessionId/${ResourceName.Messages}/:messageId`, getMessage);
app.post(`/${ResourceName.Websites}/:websiteId/${ResourceName.Sessions}/:sessionId/${ResourceName.Messages}/`, postMessage);
app.get(`/${ResourceName.Websites}/:websiteId/${ResourceName.Sessions}/:sessionId/${ResourceName.Messages}`, listMessages);
app.delete(`/${ResourceName.Websites}/:websiteId/${ResourceName.Sessions}/:sessionId/${ResourceName.Messages}/:messageId`, deleteMessage);

app.get(`/${ResourceName.Websites}/:websiteId/${ResourceName.Sessions}/:sessionId/${ResourceName.Messages}/:messageId/reply`, getReply);


export const chat = functions.onRequest(app);
