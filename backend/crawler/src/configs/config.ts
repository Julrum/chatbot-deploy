import {Express} from "express";
export const config = {
  chromaFunctionUrl: "https://us-central1-chatbot-dev-406508.cloudfunctions.net/chroma",
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  listen: (app: Express) => {},
};
