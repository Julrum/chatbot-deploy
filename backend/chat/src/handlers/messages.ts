import {Request, Response} from "express";
import {messagesCollection, Message} from "../resources/messages";
import {HttpsError} from "firebase-functions/v2/https";

/**
 * Get a message by id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * GET /websites/website_id/sessions/session_id/messages/message_id
 */
export async function getMessage(req: Request, res: Response): Promise<void> {
  try {
    const message = await messagesCollection.get(
      req.params.website_id,
      req.params.session_id,
      req.params.message_id
    );
    res.status(200).send(message);
  } catch (error) {
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).send(error.message);
      return;
    }
    res.status(500).send(JSON.stringify(error));
  }
}

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
export async function postMessage(req: Request, res: Response): Promise<void> {
  try {
    const newMessage = await messagesCollection.add(
      req.body,
      req.params.website_id,
      req.params.session_id
    );
    res.status(200).send(newMessage);
  } catch (error) {
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).send(error.message);
      return;
    }
    res.status(500).send(JSON.stringify(error));
  }
}

/**
 * List all messages
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * GET /websites/website_id/sessions/session_id/messages
 */
export async function listMessages(req: Request, res: Response): Promise<void> {
  const messages = await messagesCollection.list(
    req.params.website_id,
    req.params.session_id
  );
  res.status(200).send(messages);
}

/**
 * Delete a message by id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * DELETE /websites/website_id/sessions/session_id/messages/message_id
 */
export async function deleteMessage(
  req: Request, res: Response): Promise<void> {
  await messagesCollection.delete(
    req.params.website_id,
    req.params.session_id,
    req.params.message_id
  );
  res.status(200).send("Message deleted");
}

/**
 * Get a reply by message id
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 * @constructor
 * @example
 * GET /websites/website_id/sessions/session_id/messages/message_id/reply
 */
export async function getReply(req: Request, res: Response): Promise<void> {
  const message: Message = {
    id: "invalid-id",
    createdAt: new Date(),
    deletedAt: null,
    title: "Hello",
    content: `Replying at ${new Date().toISOString()}`,
    imageUrl: "https://img.vogue.co.kr/vogue/2023/08/style_64e6cac3ba0cd.jpeg",
    url: "https://startup.hanyang.ac.kr/",
  };
  res.status(200).send(message);
}
