import {Express} from "express";

export const config = {
  chromaHost: "http://localhost:8000",
  // Secret key defaults to the one in the dev environment
  // eslint-disable-next-line max-len
  openaiApiKeyUri: "projects/679803471378/secrets/chatbot-cloud-function-openai/versions/latest",
  listen: (app: Express) => {
    app.listen(8081, () => {
      console.log("Server listening on port 8081");
    });
  },
};
