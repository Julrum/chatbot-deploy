"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    chromaFunctionUrl: "http://localhost:8081",
    listen: (app) => {
        app.listen(8082, () => {
            console.log("Server listening on port 8082");
        });
    },
};
//# sourceMappingURL=local.js.map