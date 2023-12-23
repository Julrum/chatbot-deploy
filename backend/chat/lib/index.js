"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = exports.app = void 0;
/* eslint-disable max-len */
const admin = require("firebase-admin");
const cors = require("cors");
const express = require("express");
const functions = require("firebase-functions/v2/https");
const pulse_1 = require("@orca.ai/pulse");
const websites_1 = require("./handlers/websites");
const sessions_1 = require("./handlers/sessions");
const messages_1 = require("./handlers/messages");
const config_1 = require("./configs/config");
admin.initializeApp();
exports.app = express();
exports.app.use(cors({ origin: true }));
exports.app.use(express.urlencoded({ extended: true }));
exports.app.use(express.json());
exports.app.get("/ping", (req, res) => {
    res.status(200).send({
        message: "pong",
        timestamp: new Date().toISOString(),
    });
});
exports.app.get(`/${pulse_1.ResourceName.Websites}/:websiteId`, websites_1.getWebsite);
exports.app.post(`/${pulse_1.ResourceName.Websites}`, websites_1.postWebsite);
exports.app.get(`/${pulse_1.ResourceName.Websites}`, websites_1.listWebsites);
exports.app.delete(`/${pulse_1.ResourceName.Websites}/:websiteId`, websites_1.deleteWebsite);
exports.app.get(`/${pulse_1.ResourceName.Websites}/:websiteId/${pulse_1.ResourceName.Sessions}/:sessionId`, sessions_1.getSession);
exports.app.post(`/${pulse_1.ResourceName.Websites}/:websiteId/${pulse_1.ResourceName.Sessions}`, sessions_1.postSession);
exports.app.get(`/${pulse_1.ResourceName.Websites}/:websiteId/${pulse_1.ResourceName.Sessions}`, sessions_1.listSessions);
exports.app.delete(`/${pulse_1.ResourceName.Websites}/:websiteId/${pulse_1.ResourceName.Sessions}/:sessionId`, sessions_1.deleteSession);
exports.app.get(`/${pulse_1.ResourceName.Websites}/:websiteId/${pulse_1.ResourceName.Sessions}/:sessionId/${pulse_1.ResourceName.Messages}/:messageId`, messages_1.getMessage);
exports.app.post(`/${pulse_1.ResourceName.Websites}/:websiteId/${pulse_1.ResourceName.Sessions}/:sessionId/${pulse_1.ResourceName.Messages}/`, messages_1.postMessage);
exports.app.get(`/${pulse_1.ResourceName.Websites}/:websiteId/${pulse_1.ResourceName.Sessions}/:sessionId/${pulse_1.ResourceName.Messages}`, messages_1.listMessages);
exports.app.delete(`/${pulse_1.ResourceName.Websites}/:websiteId/${pulse_1.ResourceName.Sessions}/:sessionId/${pulse_1.ResourceName.Messages}/:messageId`, messages_1.deleteMessage);
exports.app.get(`/${pulse_1.ResourceName.Websites}/:websiteId/${pulse_1.ResourceName.Sessions}/:sessionId/${pulse_1.ResourceName.Messages}/:messageId/reply`, messages_1.getReply);
exports.app.use((req, res) => {
    res.status(404).send({
        message: `Route ${req.url} not found. Maybe you forgot to add resource paths?`,
    });
});
config_1.config.listen(exports.app);
exports.chat = functions.onRequest(exports.app);
//# sourceMappingURL=index.js.map