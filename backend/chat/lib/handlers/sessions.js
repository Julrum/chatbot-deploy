"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSession = exports.listSessions = exports.postSession = exports.getSession = void 0;
const sessions_1 = require("../resources/sessions");
const https_1 = require("firebase-functions/v2/https");
const getSession = async (req, res) => {
    const websiteId = req.params.website_id;
    const sessionId = req.params.session_id;
    try {
        const session = await sessions_1.sessionCollection.get(websiteId, sessionId);
        res.status(200).send(session);
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            res.status(error.httpErrorCode.status).send(error.message);
            return;
        }
        res.status(500).send(JSON.stringify(error));
    }
};
exports.getSession = getSession;
const postSession = async (req, res) => {
    const websiteId = req.params.website_id;
    try {
        const newSession = await sessions_1.sessionCollection.add(req.body, websiteId);
        res.status(200).send(newSession);
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            res.status(error.httpErrorCode.status).send(error.message);
            return;
        }
        res.status(500).send(JSON.stringify(error));
    }
};
exports.postSession = postSession;
const listSessions = async (req, res) => {
    const websiteId = req.params.website_id;
    const sessions = await sessions_1.sessionCollection.list(websiteId);
    res.status(200).send(sessions);
};
exports.listSessions = listSessions;
const deleteSession = async (req, res) => {
    const websiteId = req.params.website_id;
    const sessionId = req.params.session_id;
    await sessions_1.sessionCollection.delete(websiteId, sessionId);
    res.status(200).send();
};
exports.deleteSession = deleteSession;
//# sourceMappingURL=sessions.js.map