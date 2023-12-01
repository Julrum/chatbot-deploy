"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReply = exports.deleteMessage = exports.listMessages = exports.postMessage = exports.getMessage = void 0;
const messages_1 = require("../resources/messages");
const https_1 = require("firebase-functions/v2/https");
/**
 * Get a message by id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * GET /websites/website_id/sessions/session_id/messages/message_id
 */
async function getMessage(req, res) {
    try {
        const message = await messages_1.messagesCollection.get(req.params.website_id, req.params.session_id, req.params.message_id);
        res.status(200).send(message);
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            res.status(error.httpErrorCode.status).send(error.message);
            return;
        }
        res.status(500).send(JSON.stringify(error));
    }
}
exports.getMessage = getMessage;
/**
 * Create a message
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * POST /websites/website_id/sessions/session_id/messages
 * {
 *   "text": "Hello, how can I help you?"
 * }
 */
async function postMessage(req, res) {
    try {
        const newMessage = await messages_1.messagesCollection.add(req.body, req.params.website_id, req.params.session_id);
        res.status(200).send(newMessage);
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            res.status(error.httpErrorCode.status).send(error.message);
            return;
        }
        res.status(500).send(JSON.stringify(error));
    }
}
exports.postMessage = postMessage;
/**
 * List all messages
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * GET /websites/website_id/sessions/session_id/messages
 */
async function listMessages(req, res) {
    const messages = await messages_1.messagesCollection.list(req.params.website_id, req.params.session_id);
    res.status(200).send(messages);
}
exports.listMessages = listMessages;
/**
 * Delete a message by id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * DELETE /websites/website_id/sessions/session_id/messages/message_id
 */
async function deleteMessage(req, res) {
    await messages_1.messagesCollection.delete(req.params.website_id, req.params.session_id, req.params.message_id);
    res.status(200).send("Message deleted");
}
exports.deleteMessage = deleteMessage;
/**
 * Get a reply by message id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * GET /websites/website_id/sessions/session_id/messages/message_id/reply
 */
async function getReply(req, res) {
    const message = {
        id: "invalid-id",
        createdAt: new Date(),
        deletedAt: null,
        children: [
            {
                title: "Hello",
                role: messages_1.MessageRole.assistant,
                content: `Replying at ${new Date().toISOString()}`,
                imageUrl: "https://img.vogue.co.kr/vogue/2023/08/style_64e6cac3ba0cd.jpeg",
                url: "https://startup.hanyang.ac.kr/",
            },
        ],
    };
    res.status(200).send(message);
}
exports.getReply = getReply;
//# sourceMappingURL=messages.js.map