import functionUrls from "./function-urls.json"; 
import { FunctionName } from "../deploy/gcf";
export enum Phase {
  local = 'local',
  dev = 'dev',
  prod = 'prod',
}

function getFunctionURL(phase: Phase, functionName: FunctionName): string {
  const url = functionUrls[functionName][phase];
  if (!url) {
    throw new Error(`No function URL for phase: ${phase}, functionName: ${functionName}`);
  }
  return url;
}

export function getFunctionURLFromEnv(functionName: FunctionName): string {
  let phase: Phase;
  try {
    phase = Phase[(process.env.PHASE ?? '') as keyof typeof Phase];
  } catch (error) {
    throw new Error(`Invalid phase: ${process.env.PHASE}`);
  }
  const functionURL = getFunctionURL(phase, functionName);
  if (!functionURL) {
    throw new Error('FUNCTION_URL is not set, it should be like: https://us-central1-<project-name>.cloudfunctions.net/<function-name> OR http://localhost:8080');
  }
  return functionURL;
}


