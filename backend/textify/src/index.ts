import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import {CrawledDocument, ResourceName, StringMessage, TextifyResponse, TextifyText} from '@orca.ai/pulse';
import { getDriver } from './driver';
import { TextifyRequest, TextifyTextSource } from '@orca.ai/pulse';
import { validateTextifyRequest } from './type-util';
import { extractTextFromImage } from './ocr';
import { getFirebaseAppByPhase } from './firebase-helper';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const firebaseApp = getFirebaseAppByPhase();

function getTextifyTextId(text: TextifyText): string {
  return `${text.documentId}=${text.source}-${text.startIndex}-${text.endIndex}`;
}

function setIdsToTexts(texts: TextifyText[]): TextifyText[] {
  return texts.map((text) => {
    return {
      ...text,
      id: getTextifyTextId(text),
      createdAt: (new Date()).toISOString(),
    } as TextifyText;
  });
}

async function writeTextsToFirestore(websiteId: string, texts: TextifyText[]): Promise<void> {
  const db = firebaseApp.firestore();
  const batch = db.batch();
  const refs = texts.map((text) => {
    return db.collection(ResourceName.Websites).doc(websiteId).collection(ResourceName.Texts).doc(text.id!);
  });
  refs.forEach((ref, i) => {
    batch.set(ref, texts[i]);
  });
  try {
    await batch.commit();
  } catch (e) {
    const error = e as Error;
    throw new Error(`Failed to write ${texts.length} texts to firestore, error: ${error.message}`);
  }
}

type ContentExtractor = (doc: CrawledDocument) => Promise<string>;
async function splitDocumentsIntoFixedLengthTexts(
  documents: CrawledDocument[], contentExtractor: ContentExtractor,
  source: TextifyTextSource, textLength: number): Promise<TextifyText[]> {
  const promises = documents.map(async (doc) => {
    const s = await contentExtractor(doc);
    const numTexts = Math.ceil(s.length / textLength);
    const splits = Array(numTexts).fill(0).map((_, i) => {
      const startIndex = i * textLength;
      const endIndex = (i + 1) * textLength;
      return {
        documentId: doc.id,
        source,
        content: doc.content.substring(startIndex, endIndex),
        startIndex,
        endIndex,
      } as TextifyText;
    });
    return splits;
  });
  const splits = await Promise.all(promises);
  return splits.flat();
}
async function splitDocumentsIntoTexts(
  documents: CrawledDocument[], contentExtractor: ContentExtractor,
  source: TextifyTextSource, textLengths: number[]): Promise<TextifyText[]> {
    const promises = textLengths.map((textLength) => {
      return splitDocumentsIntoFixedLengthTexts(
        documents, contentExtractor, source, textLength);
    });
    const splits = await Promise.all(promises);
    const flatSplits = splits.flat();
    const validSplits = flatSplits.filter((text) => text.content.length > 0);
    return validSplits;
}

app.post("/textify", async (req, res) => {
  const textifyRequest = req.body as TextifyRequest;
  try {
    validateTextifyRequest(textifyRequest);
  } catch (e) {
    const error = e as Error;
    res.status(400).send({ message: error.message } as StringMessage);
    return;
  }
  const db = firebaseApp.firestore();
  const websiteRef = db.collection(ResourceName.Websites).doc(textifyRequest.websiteId);
  const refs = textifyRequest.documentIds.map((id) => websiteRef.collection(ResourceName.CrawledDocuments).doc(id));
  let snapshots: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>[];
  try {
    snapshots = await db.getAll(...refs);
  } catch (e) {
    const error = e as Error;
    res.status(500).send({ 
      message: `Failed to get all of ${refs.length} crawled docs, error: ${error.message}`
    } as StringMessage);
    return;
  }
  const documents = snapshots.map((snapshot) => snapshot.data() as CrawledDocument);
  const titleTexts = await splitDocumentsIntoTexts(
    documents, async (doc) => doc.title, 
    TextifyTextSource.title, 
    textifyRequest.textLengths,
  ).then(setIdsToTexts);
  try {
    await writeTextsToFirestore(textifyRequest.websiteId, titleTexts);
  } catch (e) {
    const error = e as Error;
    res.status(500).send({ 
      message: `Failed to write ${titleTexts.length} titles to firestore, error: ${error.message}`
    } as StringMessage);
    return;
  }
  
  const contentTexts = await splitDocumentsIntoTexts(
    documents, async (doc) => doc.content, 
    TextifyTextSource.content, 
    textifyRequest.textLengths,
  ).then(setIdsToTexts);
  try {
    await writeTextsToFirestore(textifyRequest.websiteId, contentTexts);
  } catch (e) {
    const error = e as Error;
    res.status(500).send({ 
      message: `Failed to write ${contentTexts.length} texts of contents to firestore, error: ${error.message}`
    } as StringMessage);
    return;
  }
  const ocrTexts = await splitDocumentsIntoTexts(
    documents, async (doc) => {
      // const promises = doc.imageUrls.map(extractTextFromImage);
      // const alls = await Promise.all(promises);
      // const results = alls.filter((result) => result.length > 0);
      // return results.join("\n");
      const results = await Promise
        .all(doc.imageUrls.map(extractTextFromImage))
        .then((results) => results.filter((result) => result.length > 0))
        .then((results) => results.join("\n"));
      return results;
    },
    TextifyTextSource.image,
    textifyRequest.textLengths,
  ).then(setIdsToTexts);
  try {
    await writeTextsToFirestore(textifyRequest.websiteId, ocrTexts);
  } catch (e) {
    const error = e as Error;
    res.status(500).send({ 
      message: `Failed to write ${ocrTexts.length} texts of images to firestore, error: ${error.message}`
    } as StringMessage);
    return;
  }
  
  let titleTextIds: string[];
  try {
    titleTextIds = titleTexts.map((text) => text.id!);
  } catch (e) {
    const error = e as Error;
    res.status(500).send({ 
      message: `Failed to get titleTextIds, error: ${error.message}`
    } as StringMessage);
    return;
  }
  let contentTextIds: string[];
  try {
    contentTextIds = contentTexts.map((text) => text.id!);
  } catch (e) {
    const error = e as Error;
    res.status(500).send({ 
      message: `Failed to get contentTextIds, error: ${error.message}`
    } as StringMessage);
    return;
  }
  let ocrTextIds: string[];
  try {
    ocrTextIds = ocrTexts.map((text) => text.id!);
  } catch (e) {
    const error = e as Error;
    res.status(500).send({ 
      message: `Failed to get ocrTextIds, error: ${error.message}`
    } as StringMessage);
    return;
  }

  res.status(200).send({
    websiteId: textifyRequest.websiteId,
    textIds: [
      ...titleTextIds,
      ...contentTextIds,
      ...ocrTextIds,
    ],
  } as TextifyResponse);
});

app.use((req, res) => {
  res.status(404).send({
    message: `Route ${req.url} not found. Maybe you forgot to add resource paths?`,
  } as StringMessage);
});

getDriver().listen(app);
export const textify = onRequest(app);
