/* eslint-disable max-len */
import * as admin from "firebase-admin";
import * as express from "express";
import * as functions from "firebase-functions/v2/https";
import {ResourceName} from "./resources/resource";
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

app.get(`/${ResourceName.Websites}/:website_id`, getWebsite);
app.post(`/${ResourceName.Websites}`, postWebsite);
app.get(`/${ResourceName.Websites}`, listWebsites);
app.delete(`/${ResourceName.Websites}/:website_id`, deleteWebsite);

app.get(`/${ResourceName.Websites}/:website_id/${ResourceName.Sessions}/:session_id`, getSession);
app.post(`/${ResourceName.Websites}/:website_id/${ResourceName.Sessions}`, postSession);
app.get(`/${ResourceName.Websites}/:website_id/${ResourceName.Sessions}`, listSessions);
app.delete(`/${ResourceName.Websites}/:website_id/${ResourceName.Sessions}/:session_id`, deleteSession);

app.get(`/${ResourceName.Websites}/:website_id/${ResourceName.Sessions}/:session_id/${ResourceName.Messages}/:message_id`, getMessage);
app.post(`/${ResourceName.Websites}/:website_id/${ResourceName.Sessions}/:session_id/${ResourceName.Messages}/`, postMessage);
app.get(`/${ResourceName.Websites}/:website_id/${ResourceName.Sessions}/:session_id/${ResourceName.Messages}`, listMessages);
app.delete(`/${ResourceName.Websites}/:website_id/${ResourceName.Sessions}/:session_id/${ResourceName.Messages}/:message_id`, deleteMessage);

app.get(`/${ResourceName.Websites}/:website_id/${ResourceName.Sessions}/:session_id/${ResourceName.Messages}/:message_id/reply`, getReply);

export const chat = functions.onRequest(app);
