export enum Phase {
  LOCAL = "local",
  DEV = "dev",
  PROD = "prod",
}

export function getPhase(): Phase {
  const phase = process.env.PHASE;
  if (phase === undefined) {
    throw new Error("PHASE environment variable is not set");
  }
  if (Object.values(Phase).includes(phase as Phase)) {
    return phase as Phase;
  }
  throw new Error(`Invalid phase: ${phase}`);
}

export function getProjectId(): string {
  const phase = getPhase();
  switch (phase) {
    case Phase.LOCAL:
      return "chatbot-dev-406508";
    case Phase.DEV:
      return "chatbot-dev-406508";
    case Phase.PROD:
      return "chatbot-32ff4";
    default:
      throw new Error(`Invalid phase: ${phase}`);
  }
}
