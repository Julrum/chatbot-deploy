"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertResourceDates = exports.ResourceName = void 0;
const v2_1 = require("firebase-functions/v2");
var ResourceName;
(function (ResourceName) {
    ResourceName["Websites"] = "websites";
    ResourceName["Sessions"] = "sessions";
    ResourceName["Messages"] = "messages";
    ResourceName["Prompts"] = "prompts";
})(ResourceName || (exports.ResourceName = ResourceName = {}));
/**
 * Ensures that the given datetime is a Date object, no matter
 * whether it was a Date object or a firebase timestamp.
 * @param {Date | FirebaseTimestamp | null} date
 * @return {Date}
 */
function dateOf(date) {
    if (date === null || date === undefined) {
        return null;
    }
    if (date instanceof Date) {
        return date;
    }
    if (typeof date === "string") {
        return new Date(date);
    }
    const timestamp = date;
    if (!timestamp._seconds || !timestamp._nanoseconds) {
        throw new Error(`Failed to convert the following object into Date: ${date}`);
    }
    return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
}
/**
 * Ensures that the given resource object's createdAt and deletedAt
 * fields are Date objects, no matter whether they were Date objects
 * or firebase timestamps.
 * @param {Resource} resource
 * @return {Resource}
 */
function convertResourceDates(resource) {
    let createdAt;
    let deletedAt;
    try {
        createdAt = dateOf(resource.createdAt);
        deletedAt = dateOf(resource.deletedAt);
    }
    catch (error) {
        v2_1.logger.error(`Error converting date object ${{ createdAt, deletedAt }},\
       error: ${error}`);
        throw error;
    }
    return Object.assign(Object.assign({}, resource), { createdAt,
        deletedAt });
}
exports.convertResourceDates = convertResourceDates;
//# sourceMappingURL=resource.js.map