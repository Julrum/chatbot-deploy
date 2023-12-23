import {Response} from "express";
import {StringMessage} from "@orca.ai/pulse";

/**
 * Sends an error response to the client with the given error.
 * @param {Response} res
 * @param {Error} error
 * @param {boolean} showStack
 * @param {Function} loggerCallback
 * @return {void}
 */
export function sendError({res, statusCode, error, showStack, loggerCallback}: {
  res: Response,
  statusCode: number,
  error: Error,
  showStack: boolean,
  loggerCallback?: (message: string) => void,
}): void {
  // showStack = showStack || false;
  showStack = true;
  const errorMessage = error.message +
    (showStack ? `\nSTACK DUMP:\n${error.stack}` : "");
  loggerCallback && loggerCallback(error.message);
  res.status(statusCode).send({
    message: errorMessage,
  } as StringMessage);
}
