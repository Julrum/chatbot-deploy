"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWebsite = exports.listWebsites = exports.postWebsite = exports.getWebsite = void 0;
const websites_1 = require("../resources/websites");
const https_1 = require("firebase-functions/v2/https");
const v1_1 = require("firebase-functions/v1");
/**
 * Fill optional fields of a website
 * @param {Website} website
 * @return {Website}
 */
function fillWebsiteOptionalFields(website) {
    var _a, _b, _c, _d;
    (_a = website.imageUrl) !== null && _a !== void 0 ? _a : (website.imageUrl = "https://www.hanyang.ac.kr/html-repositories/images/custom/introduction/img_hy0104_02_0102.png");
    (_b = website.primaryColor) !== null && _b !== void 0 ? _b : (website.primaryColor = "#000000");
    (_c = website.secondaryColor) !== null && _c !== void 0 ? _c : (website.secondaryColor = "#ffffff");
    // eslint-disable-next-line no-multi-str
    (_d = website.disclaimer) !== null && _d !== void 0 ? _d : (website.disclaimer = "AI 챗봇은 방문자 분들께서 우리 학부 웹사이트를 보다 편리하게 \
이용하실 수 있도록 도와드립니다. \
하지만 AI 챗봇이 우리 학부의 공식 정보와 다른 답변을 드리는 경우도 있으니,\
보다 정확한 정보는 인용된 웹사이트나 담당자 분께 문의하여 주시기 바랍니다.");
    return website;
}
const getWebsite = async (req, res) => {
    const websiteId = req.params.website_id;
    try {
        const website = await websites_1.websiteCollection.get(websiteId);
        const filledWebsite = fillWebsiteOptionalFields(website);
        res.status(200).send(filledWebsite);
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            v1_1.logger.error(`HTTPS error: ${error.message}, \
      error code = ${error.httpErrorCode}`);
            res.status(error.httpErrorCode.status).send(error.message);
            return;
        }
        else {
            v1_1.logger.error(`Non-HTTPS error: ${JSON.stringify(error)}, \
      error code = 500`);
            res.status(500).send(JSON.stringify(error));
        }
    }
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
    const filledWebsite = fillWebsiteOptionalFields(website);
    const newWebsite = await websites_1.websiteCollection.add(filledWebsite);
    res.status(200).send(newWebsite);
};
exports.postWebsite = postWebsite;
const listWebsites = async (req, res) => {
    const fetchedWebsites = await websites_1.websiteCollection.list();
    const websites = fetchedWebsites.map((website) => fillWebsiteOptionalFields(website));
    res.status(200).send(websites);
};
exports.listWebsites = listWebsites;
const deleteWebsite = async (req, res) => {
    const websiteId = req.params.website_id;
    if (!websiteId) {
        res.status(400).send("Website ID is required");
        return;
    }
    await websites_1.websiteCollection.delete(websiteId);
    res.status(200).send("Website deleted");
};
exports.deleteWebsite = deleteWebsite;
//# sourceMappingURL=websites.js.map