"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessOpenAIAPIKey = void 0;
const secret_manager_1 = require("@google-cloud/secret-manager");
/**
 * @return {Promise<string>} openai api key.
 */
async function accessOpenAIAPIKey() {
    var _a, _b;
    const secretManagerClient = new secret_manager_1.SecretManagerServiceClient();
    const openaiAPIKeySecret = await secretManagerClient.accessSecretVersion({
        // eslint-disable-next-line max-len
        name: "projects/228958603217/secrets/chatbot-cloud-function-openai/versions/latest",
    });
    const openaiAPIKey = (_b = (_a = openaiAPIKeySecret[0].payload) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.toString();
    if (!openaiAPIKey) {
        throw new Error("Failed to get openai api key from secret manager.");
    }
    return openaiAPIKey;
}
exports.accessOpenAIAPIKey = accessOpenAIAPIKey;
//# sourceMappingURL=openai_api.js.map