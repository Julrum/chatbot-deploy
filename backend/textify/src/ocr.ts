import {ImageAnnotatorClient} from "@google-cloud/vision";
import {logger} from "firebase-functions";
import { getProjectId } from "./phase";
/**
 * Extracts text from an image using Google Cloud Vision API.
 * @param {string} imageUrl
 * @return {Promise<string>}
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  const client = new ImageAnnotatorClient({
    clientOptions: {
      projectId: getProjectId(),
    },
  });
  // Download raw image bytes.
  const imageBytes = await (await fetch(imageUrl)).arrayBuffer();
  const imageBuffer = Buffer.from(imageBytes);
  if (imageBuffer.byteLength > 4 * 1024 * 1024) {
    logger.warn(`Image size exceeds 4MB, which exceeds Google Cloud Vision\
    limit. Skipping OCR.(image url=${imageUrl})`);
    return "";
  }
  const [res] = await client.textDetection(imageBuffer);
  if (res.error) {
    console.error(`Error in response from Google Cloud Vision API, error code=${res.error.code}, message=${res.error.message}, details=${res.error.details}`);
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
