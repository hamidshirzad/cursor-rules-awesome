"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
class Cache {
    static instance;
    context;
    constructor(context) {
        this.context = context;
    }
    static getInstance(context) {
        if (!Cache.instance) {
            Cache.instance = new Cache(context);
        }
        return Cache.instance;
    }
    set(key, data) {
        this.context.globalState.update(key, data);
    }
    get(key) {
        return this.context.globalState.get(key) || null;
    }
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map