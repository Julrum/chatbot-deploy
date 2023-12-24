"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromImage = void 0;
const vision_1 = require("@google-cloud/vision");
const firebase_functions_1 = require("firebase-functions");
/**
 * Extracts text from an image using Google Cloud Vision API.
 * @param {string} imageUrl
 * @return {Promise<string>}
 */
async function extractTextFromImage(imageUrl) {
    const client = new vision_1.ImageAnnotatorClient();
    // Download raw image bytes.
    const imageBytes = await (await fetch(imageUrl)).arrayBuffer();
    const imageBuffer = Buffer.from(imageBytes);
    if (imageBuffer.byteLength > 4 * 1024 * 1024) {
        firebase_functions_1.logger.warn(`Image size exceeds 4MB, which exceeds Google Cloud Vision\
    limit. Skipping OCR.(image url=${imageUrl})`);
        return "";
    }
    const [res] = await client.textDetection(imageBuffer);
    if (res.error) {
        throw new Error(`Error in response from Google Cloud Vision API. \
      error code=${res.error.code}, message=${res.error.message}, \
      details=${res.error.details}`);
    }
    const fullTextAnnotation = res.fullTextAnnotation;
    if (!fullTextAnnotation) {
        throw new Error(`No fullTextAnnotation field in ${res}, url=${imageUrl}`);
    }
    const fullText = fullTextAnnotation.text;
    if (!fullText) {
        throw new Error(`No full text for ${imageUrl}`);
    }
    return fullText;
}
exports.extractTextFromImage = extractTextFromImage;
// extractTextFromImage("https://startup.hanyang.ac.kr/api/resource/BOARD_CONTENT_IMG/2023/06/be22b04c-408c-4d6c-ad98-8a3ba80efff1.jpg").then(
//   (text) => {
//     console.log(text);
//   },
//   (e) => {
//     console.error(e);
//   },
// );
//# sourceMappingURL=ocr.js.map