"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSession = exports.listSessions = exports.postSession = exports.getSession = void 0;
const error_handler_1 = require("../util/error-handler");
const v2_1 = require("firebase-functions/v2");
const sessions_1 = require("../dao/sessions");
const getSession = async (req, res) => {
    const websiteId = req.params.websiteId;
    const sessionId = req.params.sessionId;
    const dao = new sessions_1.SessionDAO();
    try {
        const session = await dao.get(websiteId, sessionId);
        res.status(200).send(session);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: v2_1.logger.error,
        });
    }
};
exports.getSession = getSession;
const postSession = async (req, res) => {
    const websiteId = req.params.websiteId;
    const dao = new sessions_1.SessionDAO();
    try {
        const newSession = await dao.add(req.body, websiteId);
        res.status(200).send(newSession);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: v2_1.logger.error,
        });
    }
};
exports.postSession = postSession;
const listSessions = async (req, res) => {
    const websiteId = req.params.websiteId;
    if (!websiteId) {
        res.status(400).send({
            message: "Missing website ID",
        });
        return;
    }
    const dao = new sessions_1.SessionDAO();
    try {
        const sessions = await dao.list(websiteId);
        res.status(200).send(sessions);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: v2_1.logger.error,
        });
    }
};
exports.listSessions = listSessions;
const deleteSession = async (req, res) => {
    const websiteId = req.params.websiteId;
    const sessionId = req.params.sessionId;
    const dao = new sessions_1.SessionDAO();
    try {
        await dao.delete(websiteId, sessionId);
        res.status(200).send({
            message: `Session ${sessionId} deleted`,
        });
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: v2_1.logger.error,
        });
    }
};
exports.deleteSession = deleteSession;
//# sourceMappingURL=sessions.js.map