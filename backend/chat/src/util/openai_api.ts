import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
/**
 * @return {Promise<string>} openai api key.
 */
export async function accessOpenAIAPIKey() : Promise<string> {
  const secretManagerClient = new SecretManagerServiceClient();
  const openaiAPIKeySecret = await secretManagerClient.accessSecretVersion({
    // eslint-disable-next-line max-len
    name: "projects/228958603217/secrets/chatbot-cloud-function-openai/versions/latest",
  });
  const openaiAPIKey = openaiAPIKeySecret[0].payload?.data?.toString();
  if (!openaiAPIKey) {
    throw new Error("Failed to get openai api key from secret manager.");
  }
  return openaiAPIKey;
}