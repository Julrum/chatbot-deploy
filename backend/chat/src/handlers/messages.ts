/* eslint-disable max-len */
import {Request, Response} from "express";
import {HttpsError} from "firebase-functions/v2/https";
import {accessOpenAIAPIKey} from "../util/openai_api";
import {logger} from "firebase-functions";
import * as openai from "openai";
import {
  ChildMessage,
  HttpError,
  Message,
  MessageRole,
  StringMessage,
  Query,
  OpenAIMessage,
  ChromaClient,
} from "@orca.ai/pulse";
import {MessageDAO} from "../dao/messages";
import {sendError} from "../util/error-handler";
import {config} from "../configs/config";
/**
 * Get a message by id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * GET /websites/websiteId/sessions/sessionId/messages/messageId
 */
export async function getMessage(req: Request, res: Response): Promise<void> {
  const dao = new MessageDAO();
  try {
    const message = await dao.get(
      req.params.websiteId,
      req.params.sessionId,
      req.params.messageId
    );
    res.status(200).send(message);
  } catch (error) {
    sendError({
      res,
      statusCode: (error as HttpError).statusCode,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
    return;
  }
}

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
export async function postMessage(req: Request, res: Response): Promise<void> {
  const dao = new MessageDAO();
  try {
    const newMessage = await dao.add(
      req.body,
      req.params.websiteId,
      req.params.sessionId
    );
    res.status(200).send(newMessage);
  } catch (error) {
    sendError({
      res,
      statusCode: (error as HttpError).statusCode,
      error: new Error(`Failed to add message at websiteId=${req.params.websiteId}, sessionId=${req.params.sessionId}, message=${JSON.stringify(req.body)}`),
      showStack: true,
      loggerCallback: logger.error,
    });
    return;
  }
}

/**
 * List all messages
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * GET /websites/websiteId/sessions/sessionId/messages
 */
export async function listMessages(req: Request, res: Response): Promise<void> {
  const dao = new MessageDAO();
  try {
    const messages = await dao.list(
      req.params.websiteId,
      req.params.sessionId
    );
    res.status(200).send(messages);
  } catch (error) {
    sendError({
      res,
      statusCode: (error as HttpError).statusCode,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
    return;
  }
}

/**
 * Delete a message by id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * DELETE /websites/websiteId/sessions/sessionId/messages/messageId
 */
export async function deleteMessage(
  req: Request, res: Response): Promise<void> {
  const dao = new MessageDAO();
  try {
    await dao.delete(
      req.params.websiteId,
      req.params.sessionId,
      req.params.messageId
    );
    res.status(200).send({message: "Message deleted"} as StringMessage);
  } catch (error) {
    sendError({
      res,
      statusCode: (error as HttpError).statusCode,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
    return;
  }
}

/**
 * Get a reply by message id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * GET /websites/websiteId/sessions/sessionId/messages/messageId/reply
 */
export async function getReply(req: Request, res: Response): Promise<void> {
  let openaiAPIKey: string;
  try {
    openaiAPIKey = await accessOpenAIAPIKey();
  } catch (error) {
    sendError({
      res,
      statusCode: 500,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
    return;
  }

  const websiteId = req.params.websiteId;
  const sessionId = req.params.sessionId;
  const messageId = req.params.messageId;
  if (!websiteId || !sessionId || !messageId) {
    logger.error(`getReply error: Missing one of websiteId, sessionId, messageId in URL parameters, req.params=${JSON.stringify(req.params)}`);
    res.status(400).send({message: "Missing websiteId, sessionId or messageId"} as StringMessage);
    return;
  }
  const windowSizes = [1, 8, 16];
  const largestWindowSize = windowSizes.sort()[windowSizes.length - 1];
  let history: Message[] = [];
  try {
    const dao = new MessageDAO();
    history = await dao.listRecentN(websiteId, sessionId, largestWindowSize);
  } catch (error) {
    sendError({
      res,
      statusCode: (error as HttpError).statusCode,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
    return;
  }
  history = history.filter((message) => message.children.length > 0);
  if (history.length === 0) {
    const e = new HttpError(404, `No non-carousel message found in \
    websiteId=${websiteId}, sessionId=${sessionId}, \
    history=${JSON.stringify(history)}`);
    sendError({
      res,
      statusCode: e.statusCode,
      error: e,
      showStack: true,
      loggerCallback: logger.error,
    });
    return;
  }
  const userMessages = history.filter((message) => message.role === MessageRole.user);
  if (userMessages.length === 0) {
    sendError({
      res,
      statusCode: 404,
      error: new HttpError(404, `No user message found in \
      websiteId=${websiteId}, sessionId=${sessionId}, \
      history=${JSON.stringify(history)}`),
      showStack: true,
      loggerCallback: logger.error,
    });
    return;
  }
  const contentMessages = history.filter((message) =>
    message.role == MessageRole.assistant ||
    message.role == MessageRole.user);
  const chatContext = contentMessages.map((message) => {
    const childMessage = message.children[0];
    const content = childMessage ? childMessage.content : "";
    return {
      role: message.role,
      content: content,
    } as OpenAIMessage;
  });

  const lastUserMessage = userMessages[userMessages.length - 1];
  const queries = lastUserMessage.children.map((child) => {
    if (!child.content) {
      logger.error(`Failed to retrieve children content from lastUserMessage=${JSON.stringify(lastUserMessage)}`);
      res.status(400).send({message: `No content found in last user message in websiteId=${websiteId}, sessionId=${sessionId}`} as StringMessage);
      return;
    }
    return child.content;
  });
  if (queries.length === 0) {
    logger.error(`Failed to retrieve children content from lastUserMessage=${JSON.stringify(lastUserMessage)}`);
    res.status(400).send({message: `No query found in last user message in websiteId=${websiteId}, sessionId=${sessionId}`} as StringMessage);
    return;
  }
  const query = {
    maxDistance: 0.5,
    minContentLength: 20,
    numResults: 5,
    queries,
  } as Query;
  const queryAPIUrl = config.chromaFunctionUrl;
  // let queryResultObjects: AxiosResponse<QueryResult[]>;
  const chromaClient = new ChromaClient(queryAPIUrl);
  const retrievalsPerQuery = await chromaClient.query(websiteId, query);
  if (retrievalsPerQuery.length !== 1) {
    const errorMessage = `Expected 1 query result, but got ${retrievalsPerQuery.length} query results`;
    logger.error(errorMessage);
    res.status(500).send({message: errorMessage} as StringMessage);
    return;
  }
  const retrievedDocumentsWithDuplicates = retrievalsPerQuery[0];
  const retrievedDocuments = retrievedDocumentsWithDuplicates.filter((document, index, self) => {
    return index === self.findIndex((doc) => (
      doc.url === document.url
    ));
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
    role: MessageRole.system,
    content: systemPrompt,
  } as OpenAIMessage;
  const userMessage = {
    role: MessageRole.user,
    // eslint-disable-next-line max-len
    content: `{"userQuestion": ${queries[0]}, "retrieval": ${promptFromRetrieval}}`,
  } as OpenAIMessage;
  const messages = [systemMessage, ...chatContext, userMessage];
  const openaiClient = new openai.OpenAI({apiKey: openaiAPIKey});
  let openaiResponse: openai.OpenAI.ChatCompletion;
  try {
    openaiResponse = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    });
  } catch (error) {
    if (error instanceof HttpsError) {
      logger.error(`getReply error: ${error.message}`);
      res.status(error.httpErrorCode.status).send(error.message);
      return;
    }
    logger.error(`Failed to retrieve data from openaiResponse=${JSON.stringify(error)}`);
    res.status(500).send(JSON.stringify(error));
    return;
  }
  const reply = openaiResponse.choices[0].message.content;
  let openaiReplyMessage: Message | null = null;
  const dao = new MessageDAO();
  try {
    openaiReplyMessage = await dao.add({
      id: null,
      createdAt: null,
      deletedAt: null,
      role: MessageRole.assistant,
      children: [
      {
        title: null,
        content: reply,
        imageUrl: null,
        url: null,
      } as ChildMessage,
      ],
    } as Message, websiteId, sessionId);
  } catch (error) {
    sendError({
      res,
      statusCode: (error as HttpError).statusCode,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
  }
  if (!openaiReplyMessage) {
    res.status(500).send({message: "Internal server error, failed to save reply message"} as StringMessage);
    return;
  }
  let retrievalCarouselMessage: Message | null = null;
  if (retrievedDocuments.length === 0) {
    res.status(200).send([openaiReplyMessage]);
    return;
  }
  try {
    retrievalCarouselMessage = await dao.add({
      id: null,
      createdAt: null,
      deletedAt: null,
      role: MessageRole.assistant,
      children: retrievedDocuments.map((doc) => {
        return {
          title: doc.title,
          content: doc.content,
          imageUrl: doc.imageUrls[0] ?? null,
          url: doc.url,
        } as ChildMessage;
      }),
    }, websiteId, sessionId);
  } catch (error) {
    sendError({
      res,
      statusCode: (error as HttpError).statusCode,
      error: error as Error,
      showStack: true,
      loggerCallback: logger.error,
    });
    res.status(500).send(JSON.stringify(error));
  }
  if (!retrievalCarouselMessage) {
    res.status(500).send({message: "Internal server error, failed to save retrieval carousel message"} as StringMessage);
    return;
  }
  res.status(200).send([openaiReplyMessage, retrievalCarouselMessage]);
}
