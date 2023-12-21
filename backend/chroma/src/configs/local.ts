import {Express} from "express";

export const config = {
  chromaHost: "http://localhost:8000",
  listen: (app: Express) => {
    app.listen(8081, () => {
      console.log("Server listening on port 8081");
    });
  },
};
