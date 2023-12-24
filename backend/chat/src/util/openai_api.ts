import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
/**
 * @return {Promise<string>} openai api key.
 */
export async function accessOpenAIAPIKey() : Promise<string> {
  const secretManagerClient = new SecretManagerServiceClient();
  const phase = process.env.PHASE;
  if (!phase) {
    throw new Error("Missing PHASE env var, should be one of: dev, prod");
  }
  const projectNumber = (() => {
    switch (phase) {
    case "dev":
      return "679803471378";
    case "prod":
      return "228958603217";
    default:
      throw new Error(`Invalid PHASE env var: ${phase}`);
    }
  })();
  const openaiAPIKeySecret = await secretManagerClient.accessSecretVersion({
    // TODO: Make this as env var...
    // eslint-disable-next-line max-len
    name: `projects/${projectNumber}/secrets/chatbot-cloud-function-openai/versions/latest`,
  });
  const openaiAPIKey = openaiAPIKeySecret[0].payload?.data?.toString();
  if (!openaiAPIKey) {
    throw new Error("Failed to get openai api key from secret manager.");
  }
  return openaiAPIKey;
}
