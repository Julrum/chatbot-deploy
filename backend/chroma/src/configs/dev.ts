import {Express} from "express";
export const config = {
  chromaHost: "http://10.128.0.2:8000",
  // eslint-disable-next-line max-len
  openaiApiKeyUri: "projects/679803471378/secrets/chatbot-cloud-function-openai/versions/latest",
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  listen: (app: Express) => {},
};
