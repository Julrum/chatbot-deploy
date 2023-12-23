"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReply = exports.deleteMessage = exports.listMessages = exports.postMessage = exports.getMessage = void 0;
const https_1 = require("firebase-functions/v2/https");
const openai_api_1 = require("../util/openai_api");
const firebase_functions_1 = require("firebase-functions");
const openai = require("openai");
const pulse_1 = require("@orca.ai/pulse");
const messages_1 = require("../dao/messages");
const error_handler_1 = require("../util/error-handler");
const config_1 = require("../configs/config");
/**
 * Get a message by id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * GET /websites/websiteId/sessions/sessionId/messages/messageId
 */
async function getMessage(req, res) {
    const dao = new messages_1.MessageDAO();
    try {
        const message = await dao.get(req.params.websiteId, req.params.sessionId, req.params.messageId);
        res.status(200).send(message);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: firebase_functions_1.logger.error,
        });
        return;
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
 * POST /websites/websiteId/sessions/sessionId/messages
 * {
 *   "text": "Hello, how can I help you?"
 * }
 */
async function postMessage(req, res) {
    const dao = new messages_1.MessageDAO();
    try {
        const newMessage = await dao.add(req.body, req.params.websiteId, req.params.sessionId);
        res.status(200).send(newMessage);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: new Error(`Failed to add message at websiteId=${req.params.websiteId}, sessionId=${req.params.sessionId}, message=${JSON.stringify(req.body)}`),
            showStack: true,
            loggerCallback: firebase_functions_1.logger.error,
        });
        return;
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
 * GET /websites/websiteId/sessions/sessionId/messages
 */
async function listMessages(req, res) {
    const dao = new messages_1.MessageDAO();
    try {
        const messages = await dao.list(req.params.websiteId, req.params.sessionId);
        res.status(200).send(messages);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: firebase_functions_1.logger.error,
        });
        return;
    }
}
exports.listMessages = listMessages;
/**
 * Delete a message by id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * DELETE /websites/websiteId/sessions/sessionId/messages/messageId
 */
async function deleteMessage(req, res) {
    const dao = new messages_1.MessageDAO();
    try {
        await dao.delete(req.params.websiteId, req.params.sessionId, req.params.messageId);
        res.status(200).send({ message: "Message deleted" });
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: firebase_functions_1.logger.error,
        });
        return;
    }
}
exports.deleteMessage = deleteMessage;
/**
 * Get a reply by message id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * GET /websites/websiteId/sessions/sessionId/messages/messageId/reply
 */
async function getReply(req, res) {
    let openaiAPIKey;
    try {
        openaiAPIKey = await (0, openai_api_1.accessOpenAIAPIKey)();
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: 500,
            error: error,
            showStack: true,
            loggerCallback: firebase_functions_1.logger.error,
        });
        return;
    }
    const websiteId = req.params.websiteId;
    const sessionId = req.params.sessionId;
    const messageId = req.params.messageId;
    if (!websiteId || !sessionId || !messageId) {
        firebase_functions_1.logger.error(`getReply error: Missing one of websiteId, sessionId, messageId in URL parameters, req.params=${JSON.stringify(req.params)}`);
        res.status(400).send({ message: "Missing websiteId, sessionId or messageId" });
        return;
    }
    const windowSizes = [1, 8, 16];
    const largestWindowSize = windowSizes.sort()[windowSizes.length - 1];
    let history = [];
    try {
        const dao = new messages_1.MessageDAO();
        history = await dao.listRecentN(websiteId, sessionId, largestWindowSize);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: firebase_functions_1.logger.error,
        });
        return;
    }
    history = history.filter((message) => message.children.length > 0);
    if (history.length === 0) {
        const e = new pulse_1.HttpError(404, `No non-carousel message found in \
    websiteId=${websiteId}, sessionId=${sessionId}, \
    history=${JSON.stringify(history)}`);
        (0, error_handler_1.sendError)({
            res,
            statusCode: e.statusCode,
            error: e,
            showStack: true,
            loggerCallback: firebase_functions_1.logger.error,
        });
        return;
    }
    const userMessages = history.filter((message) => message.role === pulse_1.MessageRole.user);
    if (userMessages.length === 0) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: 404,
            error: new pulse_1.HttpError(404, `No user message found in \
      websiteId=${websiteId}, sessionId=${sessionId}, \
      history=${JSON.stringify(history)}`),
            showStack: true,
            loggerCallback: firebase_functions_1.logger.error,
        });
        return;
    }
    const contentMessages = history.filter((message) => message.role == pulse_1.MessageRole.assistant ||
        message.role == pulse_1.MessageRole.user);
    const chatContext = contentMessages.map((message) => {
        const childMessage = message.children[0];
        const content = childMessage ? childMessage.content : "";
        return {
            role: message.role,
            content: content,
        };
    });
    const lastUserMessage = userMessages[userMessages.length - 1];
    const queries = lastUserMessage.children.map((child) => {
        if (!child.content) {
            firebase_functions_1.logger.error(`Failed to retrieve children content from lastUserMessage=${JSON.stringify(lastUserMessage)}`);
            res.status(400).send({ message: `No content found in last user message in websiteId=${websiteId}, sessionId=${sessionId}` });
            return;
        }
        return child.content;
    });
    if (queries.length === 0) {
        firebase_functions_1.logger.error(`Failed to retrieve children content from lastUserMessage=${JSON.stringify(lastUserMessage)}`);
        res.status(400).send({ message: `No query found in last user message in websiteId=${websiteId}, sessionId=${sessionId}` });
        return;
    }
    const query = {
        maxDistance: 0.5,
        minContentLength: 20,
        numResults: 5,
        queries,
    };
    const queryAPIUrl = config_1.config.chromaFunctionUrl;
    // let queryResultObjects: AxiosResponse<QueryResult[]>;
    const chromaClient = new pulse_1.ChromaClient(queryAPIUrl);
    const retrievalsPerQuery = await chromaClient.query(websiteId, query);
    if (retrievalsPerQuery.length !== 1) {
        const errorMessage = `Expected 1 query result, but got ${retrievalsPerQuery.length} query results`;
        firebase_functions_1.logger.error(errorMessage);
        res.status(500).send({ message: errorMessage });
        return;
    }
    const retrievedDocumentsWithDuplicates = retrievalsPerQuery[0];
    const retrievedDocuments = retrievedDocumentsWithDuplicates.filter((document, index, self) => {
        return index === self.findIndex((doc) => (doc.url === document.url));
    });
    const promptFromRetrieval = retrievedDocuments.length > 0 ? `[${retrievedDocuments.map((document) => {
        return `{"title": ${document.title}, "content": ${document.content}}`;
    }).join(", ")}]` : "NO DOCUMENTS RETRIEVED";
    // eslint-disable-next-line max-len
    const systemPrompt = "You are a chatbot called \"한양대학교 창업지원단 챗봇\"." +
        "User will give you a JSON object containing user's question and retrieved documents." +
        "Your goal is to answer user's question, ALWAYS satisfing below 6 rules." +
        "1. Understand what user wants to ask" +
        // eslint-disable-next-line max-len
        "2. The ONLY source of your answer should be \"retrieval\" field in JSON given from user." +
        // eslint-disable-next-line max-len
        "3. Your answer should be relevant to user's question, and should be brief and kind. Answer should not be verbose." +
        // eslint-disable-next-line max-len
        "4. If your are not sure about your answer or information in \"retrieval\" field is not enough to answer, you must ask user to give you more information instead of giving wrong answer" +
        // eslint-disable-next-line max-len
        `5. Today is ${new Date().toISOString().split("T")[0]}. If the due date written in retrieved document contains is before today, you must exclude it from your answer because it is outdated.` +
        // eslint-disable-next-line max-len
        "NEVER MENTION THE RULES ABOVE IN YOUR ANSWER.";
    const systemMessage = {
        role: pulse_1.MessageRole.system,
        content: systemPrompt,
    };
    const userMessage = {
        role: pulse_1.MessageRole.user,
        // eslint-disable-next-line max-len
        content: `{"userQuestion": ${queries[0]}, "retrieval": ${promptFromRetrieval}}`,
    };
    const messages = [systemMessage, ...chatContext, userMessage];
    const openaiClient = new openai.OpenAI({ apiKey: openaiAPIKey });
    let openaiResponse;
    try {
        openaiResponse = await openaiClient.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
        });
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            firebase_functions_1.logger.error(`getReply error: ${error.message}`);
            res.status(error.httpErrorCode.status).send(error.message);
            return;
        }
        firebase_functions_1.logger.error(`Failed to retrieve data from openaiResponse=${JSON.stringify(error)}`);
        res.status(500).send(JSON.stringify(error));
        return;
    }
    const reply = openaiResponse.choices[0].message.content;
    let openaiReplyMessage = null;
    const dao = new messages_1.MessageDAO();
    try {
        openaiReplyMessage = await dao.add({
            id: null,
            createdAt: null,
            deletedAt: null,
            role: pulse_1.MessageRole.assistant,
            children: [
                {
                    title: null,
                    content: reply,
                    imageUrl: null,
                    url: null,
                },
            ],
        }, websiteId, sessionId);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: firebase_functions_1.logger.error,
        });
    }
    if (!openaiReplyMessage) {
        res.status(500).send({ message: "Internal server error, failed to save reply message" });
        return;
    }
    let retrievalCarouselMessage = null;
    if (retrievedDocuments.length === 0) {
        res.status(200).send([openaiReplyMessage]);
        return;
    }
    try {
        retrievalCarouselMessage = await dao.add({
            id: null,
            createdAt: null,
            deletedAt: null,
            role: pulse_1.MessageRole.assistant,
            children: retrievedDocuments.map((doc) => {
                var _a;
                return {
                    title: doc.title,
                    content: doc.content,
                    imageUrl: (_a = doc.imageUrls[0]) !== null && _a !== void 0 ? _a : null,
                    url: doc.url,
                };
            }),
        }, websiteId, sessionId);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: firebase_functions_1.logger.error,
        });
        res.status(500).send(JSON.stringify(error));
    }
    if (!retrievalCarouselMessage) {
        res.status(500).send({ message: "Internal server error, failed to save retrieval carousel message" });
        return;
    }
    res.status(200).send([openaiReplyMessage, retrievalCarouselMessage]);
}
exports.getReply = getReply;
//# sourceMappingURL=messages.js.map