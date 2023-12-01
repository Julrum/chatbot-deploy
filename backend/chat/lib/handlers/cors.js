"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsHelper = void 0;
/**
 * Handle CORS preflight requests
 * @param {Request} req
 * @param {Response} res
 * @return {Response}
 */
function corsHelper(req, res) {
    res = res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res = res
            .set("Access-Control-Allow-Methods", ["GET", "POST", "DELETE"])
            .set("Access-Control-Allow-Headers", "Content-Type")
            .set("Access-Control-Max-Age", "3600")
            .status(204);
    }
    return res;
}
exports.corsHelper = corsHelper;
//# sourceMappingURL=cors.js.map