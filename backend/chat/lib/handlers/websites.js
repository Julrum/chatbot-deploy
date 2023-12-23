"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWebsite = exports.listWebsites = exports.postWebsite = exports.getWebsite = void 0;
const websites_1 = require("../dao/websites");
const v2_1 = require("firebase-functions/v2");
const error_handler_1 = require("../util/error-handler");
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
    const websiteId = req.params.websiteId;
    if (!websiteId) {
        res.status(400).send({ message: "Website ID is required" });
        return;
    }
    const dao = new websites_1.WebsiteDAO();
    try {
        const website = await dao.get(websiteId);
        const filledWebsite = fillWebsiteOptionalFields(website);
        res.status(200).send(filledWebsite);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: v2_1.logger.error,
        });
    }
};
exports.getWebsite = getWebsite;
const postWebsite = async (req, res) => {
    const website = req.body;
    if (!website.name) {
        res.status(400).send({
            message: "Website name is required"
        });
        return;
    }
    if (!website.url) {
        res.status(400).send({
            message: "Website URL is required"
        });
        return;
    }
    if (!website.description) {
        res.status(400).send({
            message: "Website description is required"
        });
        return;
    }
    const filledWebsite = fillWebsiteOptionalFields(website);
    const dao = new websites_1.WebsiteDAO();
    try {
        const newWebsite = await dao.add(filledWebsite);
        res.status(200).send(newWebsite);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: v2_1.logger.error,
        });
    }
};
exports.postWebsite = postWebsite;
const listWebsites = async (req, res) => {
    const dao = new websites_1.WebsiteDAO();
    try {
        const fetchedWebsites = await dao.list();
        const websites = fetchedWebsites.map((website) => fillWebsiteOptionalFields(website));
        res.status(200).send(websites);
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: v2_1.logger.error,
        });
    }
};
exports.listWebsites = listWebsites;
const deleteWebsite = async (req, res) => {
    const websiteId = req.params.websiteId;
    if (!websiteId) {
        res.status(400).send({ message: "Website ID is required" });
        return;
    }
    const dao = new websites_1.WebsiteDAO();
    try {
        await dao.delete(websiteId);
        res.status(200).send({ message: "Website deleted" });
    }
    catch (error) {
        (0, error_handler_1.sendError)({
            res,
            statusCode: error.statusCode,
            error: error,
            showStack: true,
            loggerCallback: v2_1.logger.error,
        });
    }
};
exports.deleteWebsite = deleteWebsite;
//# sourceMappingURL=websites.js.map