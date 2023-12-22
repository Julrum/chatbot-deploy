import {Express} from "express";
export const config = {
  chromaFunctionUrl: "http://localhost:8081",
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  listen: (app: Express) => {
    app.listen(8080, () => {
      console.log("Chat API server is listening on port 8080");
    });
  },
};
