import admin from "firebase-admin";
import { getPhase, Phase } from "./phase";

export function getFirebaseAppByPhase(): admin.app.App {
  const phase = getPhase();
  switch (phase) {
    case Phase.LOCAL:
      return admin.initializeApp({
        projectId: "chatbot-dev-406508",
        credential: admin.credential.applicationDefault(),
      });
    case Phase.DEV:
      return admin.initializeApp({
        projectId: "chatbot-dev-406508",
        credential: admin.credential.applicationDefault(),
      });
    case Phase.PROD:
      return admin.initializeApp({
        projectId: "chatbot-32ff4",
        credential: admin.credential.applicationDefault(),
      });
    default:
      throw new Error(`Invalid phase: ${phase}`);
  }
}
