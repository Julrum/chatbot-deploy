"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    chromaHost: "http://localhost:8000",
    listen: (app) => {
        app.listen(8081, () => {
            console.log("Server listening on port 8081");
        });
    },
};
//# sourceMappingURL=config.js.map