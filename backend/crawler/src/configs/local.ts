import {Express} from "express";

export const config = {
  chromaFunctionUrl: "http://localhost:8081",
  listen: (app: Express) => {
    app.listen(8082, () => {
      console.log("Server listening on port 8082");
    });
  },
};
