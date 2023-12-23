import {Express} from "express";
export const config = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  listen: (app: Express) => {
    app.listen(8084, () => {
      console.log("Like API server is listening on port 8083");
    });
  },
};
