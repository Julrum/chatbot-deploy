"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crawl_1 = require("./crawl");
(0, crawl_1.crawlThreads)(2916, 2916, 3, 3).then((threads) => {
    console.log(threads);
}).catch((e) => {
    console.error(e);
});
//# sourceMappingURL=wtf.js.map