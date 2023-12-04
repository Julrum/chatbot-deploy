"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReply = exports.deleteMessage = exports.listMessages = exports.postMessage = exports.getMessage = void 0;
const messages_1 = require("../resources/messages");
const https_1 = require("firebase-functions/v2/https");
const openai_api_1 = require("../util/openai_api");
const firebase_functions_1 = require("firebase-functions");
const openai = require("openai");
const axios_1 = require("axios");
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
            firebase_functions_1.logger.error(`postMessage error: ${error.message}`);
            firebase_functions_1.logger.error(`postMessage error stack: ${error.stack}`);
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
    let openaiAPIKey;
    try {
        openaiAPIKey = await (0, openai_api_1.accessOpenAIAPIKey)();
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            firebase_functions_1.logger.error(`getReply error: ${error.message}`);
            res.status(error.httpErrorCode.status).send(error.message);
            return;
        }
        res.status(500).send(JSON.stringify(error));
        return;
    }
    const websiteId = req.params.website_id;
    const sessionId = req.params.session_id;
    const messageId = req.params.message_id;
    if (!websiteId || !sessionId || !messageId) {
        firebase_functions_1.logger.error(`getReply error: Missing one of websiteId, sessionId, messageId in URL parameters, req.params=${JSON.stringify(req.params)}`);
        res.status(400).send("Missing websiteId, sessionId or messageId");
        return;
    }
    const windowSizes = [1, 5, 10];
    const largestWindowSize = windowSizes.sort()[windowSizes.length - 1];
    let history = [];
    try {
        history = await messages_1.messagesCollection.listRecentN(websiteId, sessionId, largestWindowSize);
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            firebase_functions_1.logger.error(`getReply error: ${error.message}`);
            res.status(error.httpErrorCode.status).send(error.message);
            return;
        }
        res.status(500).send(JSON.stringify(error));
        return;
    }
    const historySorted = history.sort((a, b) => {
        const firebaseTimestampToMilliseconds = (timestamp) => {
            if (!timestamp) {
                return 0;
            }
            if (timestamp instanceof Date) {
                return timestamp.getTime();
            }
            return timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000;
        };
        return firebaseTimestampToMilliseconds(a.createdAt) - firebaseTimestampToMilliseconds(b.createdAt);
    });
    const userMessages = historySorted.filter((message) => {
        return message.children.length > 0 &&
            message.children[0].role === messages_1.MessageRole.user;
    });
    if (userMessages.length === 0) {
        res.status(400).send(`No user message found in websiteId=${websiteId}, sessionId=${sessionId}`);
        return;
    }
    const lastUserMessage = userMessages[userMessages.length - 1];
    const chromaAPIRequest = {
        maxDistance: 0.5,
        minContentLength: 20,
        query: {
            numResults: 5,
            queries: [lastUserMessage.children[0].content],
        },
    };
    const queryAPIUrl = "https://chroma-z5eqvjec2q-uc.a.run.app/collections/hyu-startup-notice/query";
    const header = {
        "Content-Type": "application/json",
    };
    let queryResultObjects;
    try {
        queryResultObjects = await axios_1.default.post(queryAPIUrl, chromaAPIRequest, {
            headers: header,
        });
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            firebase_functions_1.logger.error(`getReply error: ${error.message}`);
            res.status(error.httpErrorCode.status).send(error.message);
            return;
        }
        firebase_functions_1.logger.error(`Failed to retrieve data from queryResultObjects=${JSON.stringify(error)}`);
        res.status(500).send(JSON.stringify(error));
        return;
    }
    if (!queryResultObjects.data) {
        firebase_functions_1.logger.error(`Failed to retrieve data from queryResultObjects=${JSON.stringify(queryResultObjects)}`);
        return;
    }
    const queryResults = queryResultObjects.data;
    if (!queryResults || queryResults.length === 0) {
        firebase_functions_1.logger.error(`Failed to retrieve data from queryResultObjects=${JSON.stringify(queryResultObjects)}`);
        return;
    }
    const queryResult = queryResults[0];
    firebase_functions_1.logger.debug(`queryResult=${JSON.stringify(queryResult)}`);
    const retrievedDocuments = queryResult ? queryResult.ids.map((id, index) => {
        var _a, _b;
        return {
            url: (_a = queryResult.metadatas[index]) === null || _a === void 0 ? void 0 : _a.url,
            title: (_b = queryResult.metadatas[index]) === null || _b === void 0 ? void 0 : _b.title,
            content: queryResult.contents[index],
        };
    }) : [];
    const promptFromRetrieval = `[${retrievedDocuments.map((document) => {
        return `{"title": ${document.title}, "content": ${document.content}}`;
    }).join(", ")}]`;
    // eslint-disable-next-line max-len
    const systemPrompt = "You are a chatbot called \"한양대학교 창업지원단 챗봇\"." +
        "User will give you a JSON object containing user's question and retrieved documents." +
        "Your goal is to answer user's question, ALWAYS satisfing below 4 rules." +
        "1. Understand what user wants to ask" +
        // eslint-disable-next-line max-len
        "2. The ONLY source of your answer should be \"retrieval\" field in JSON given from user." +
        // eslint-disable-next-line max-len
        "3. Your answer should be relavant to user's question, and should be kind and polite" +
        // eslint-disable-next-line max-len
        "4. If your are not sure about your answer or information in \"retrieval\" field is not enough to answer, you must ask user to give you more information instead of giving wrong answer";
    const systemMessage = {
        role: messages_1.MessageRole.system,
        content: systemPrompt,
    };
    const userMessage = {
        role: messages_1.MessageRole.user,
        // eslint-disable-next-line max-len
        content: `{"userQuestion": ${lastUserMessage.children[0].content}, "retrieval": ${promptFromRetrieval}}`,
    };
    const messages = [systemMessage, userMessage];
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
    try {
        openaiReplyMessage = await messages_1.messagesCollection.add({
            id: null,
            createdAt: null,
            deletedAt: null,
            children: [
                {
                    title: null,
                    role: messages_1.MessageRole.assistant,
                    content: reply,
                    imageUrl: null,
                    url: null,
                },
            ],
        }, websiteId, sessionId, messageId);
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            res.status(error.httpErrorCode.status).send(error.message);
            return;
        }
    }
    let retrievalCarouselMessage = null;
    try {
        retrievalCarouselMessage = await messages_1.messagesCollection.add({
            id: null,
            createdAt: null,
            deletedAt: null,
            children: retrievedDocuments.map((doc) => {
                return {
                    title: doc.title,
                    role: messages_1.MessageRole.assistant,
                    content: doc.content,
                    imageUrl: null,
                    url: doc.url,
                };
            }),
        }, websiteId, sessionId, messageId);
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            res.status(error.httpErrorCode.status).send(error.message);
            return;
        }
        res.status(500).send(JSON.stringify(error));
    }
    if (!openaiReplyMessage) {
        res.status(500).send("Internal server error, failed to save reply message");
        return;
    }
    if (!retrievalCarouselMessage) {
        res.status(500).send("Internal server error, failed to save retrieval carousel message");
        return;
    }
    res.status(200).send(openaiReplyMessage);
}
exports.getReply = getReply;
//# sourceMappingURL=messages.js.map