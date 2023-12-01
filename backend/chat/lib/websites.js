"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWebsite = exports.listWebsites = exports.postWebsite = exports.getWebsite = void 0;
// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
const admin = require("firebase-admin");
const getWebsite = async (req, res) => {
    const websiteId = req.params.website_id;
    const db = admin.firestore();
    const websiteRef = db.collection("websites").doc(websiteId);
    const websiteDoc = await websiteRef.get();
    if (!websiteDoc.exists) {
        res.status(404).send("Website not found");
        return;
    }
    const website = websiteDoc.data();
    res.status(200).send(website);
};
exports.getWebsite = getWebsite;
const postWebsite = async (req, res) => {
    const website = req.body;
    if (!website.name) {
        res.status(400).send("Website name is required");
        return;
    }
    if (!website.url) {
        res.status(400).send("Website URL is required");
        return;
    }
    if (!website.description) {
        res.status(400).send("Website description is required");
        return;
    }
    const db = admin.firestore();
    const websiteRef = db.collection("websites").doc();
    website.id = websiteRef.id;
    website.createdAt = new Date();
    await websiteRef.set(website);
    res.status(200).send(website);
};
exports.postWebsite = postWebsite;
const listWebsites = async (req, res) => {
    const db = admin.firestore();
    const websiteRef = db.collection("websites");
    const websiteDocs = await websiteRef.get();
    const websites = websiteDocs.docs.map((doc) => doc.data());
    res.status(200).send(websites);
};
exports.listWebsites = listWebsites;
const deleteWebsite = async (req, res) => {
    const websiteId = req.params.website_id;
    if (!websiteId) {
        res.status(400).send("Website ID is required");
        return;
    }
    const db = admin.firestore();
    const websiteRef = db.collection("websites").doc(websiteId);
    await websiteRef.delete();
    res.status(200).send();
};
exports.deleteWebsite = deleteWebsite;
//# sourceMappingURL=websites.js.map