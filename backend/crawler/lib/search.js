"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = void 0;
const model_1 = require("./model");
/**
 * @param {Collection} collection
 * @param {string} query
 */
async function search(collection, query) {
    const embeddingFunction = collection.embeddingFunction;
    if (!embeddingFunction) {
        throw new Error("Collection does not have embedding function.");
    }
    const embedding = await embeddingFunction.generate([query]);
    const searchResponse = await collection.query({
        queryEmbeddings: embedding,
        nResults: 5,
    });
    console.log("search response: ");
    const ids = searchResponse.ids[0];
    if (!searchResponse.distances) {
        throw new Error("Search response does not have distances.");
    }
    const distances = searchResponse.distances;
    const metadatas = searchResponse.metadatas[0];
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const distance = distances[i];
        const metadata = metadatas[i];
        const [threadId, offset] = (0, model_1.chromaIdDecode)(id);
        console.log(`id: ${id}, threadId: ${threadId},
    offset: ${offset}, distance: ${distance},
    metadata: ${JSON.stringify(metadata)}`);
    }
}
exports.search = search;
//# sourceMappingURL=search.js.map