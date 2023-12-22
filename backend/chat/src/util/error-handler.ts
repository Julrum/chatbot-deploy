import {Response} from "express";
import {HttpError} from "@orca.ai/pulse";

/**
 * Sends an error response to the client with the given error.
 * @param {Response} res
 * @param {Error} error
 * @param {boolean} showStack
 * @param {Function} loggerCallback
 * @return {void}
 */
export function sendError({res, error, showStack, loggerCallback}: {
  res: Response,
  error: Error,
  showStack: boolean,
  loggerCallback?: (message: string) => void,
}): void {
  // showStack = showStack || false;
  showStack = true;
  const errorMessage = error.message +
    (showStack ? `\nSTACK DUMP:\n${error.stack}` : "");
  loggerCallback && loggerCallback(error.message);
  if (error instanceof HttpError) {
    res.status(error.statusCode).send({
      message: errorMessage,
      statusCode: error.statusCode,
    });
    return;
  }
  res.status(500).send(JSON.stringify(error));
}
