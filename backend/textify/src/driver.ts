import { Phase, getPhase } from "./phase";
import express from "express";

export interface Driver {
  listen: (app: express.Express) => void;
}

function getLocalDriverPort(): number {
  const port = process.env.DRIVER_PORT;
  if (port === undefined) {
    throw new Error("PORT environment variable is not set");
  }
  const portNumber = parseInt(port, 10);
  if (isNaN(portNumber)) {
    throw new Error(`Invalid port: ${port}`);
  }
  return portNumber;
}

export function getDriver(): Driver {
  const phase = getPhase();
  switch (phase) {
    case Phase.LOCAL:
      return {
        listen: (app) => {
          const port = getLocalDriverPort();
          app.listen(port, () => {
            console.log(`Driver listening on port ${port}`);
          });
        },
      };
    case Phase.DEV:
      return {
        listen: (_) => {
          // Do nothing
        },
      };
    case Phase.PROD:
      return {
        listen: (_) => {
          // Do nothing
        },
      };
    default:
      throw new Error(`Invalid phase: ${phase}`);
  }
}