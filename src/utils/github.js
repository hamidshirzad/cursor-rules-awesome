"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCursorRulesList = fetchCursorRulesList;
exports.fetchCursorRuleContent = fetchCursorRuleContent;
const fs = __importStar(require("fs"));
const cache_1 = require("./cache");
const REPO_API_URL = 'https://api.github.com/repos/dawamr/awesome-cursorrules/contents/rules';
const RULES_CACHE_KEY = 'cursor_rules_list';
async function fetchCursorRulesList(context) {
    const cache = cache_1.Cache.getInstance(context);
    const cachedRules = cache.get(RULES_CACHE_KEY);
    const updateCache = async () => {
        try {
            const response = await fetch(REPO_API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = (await response.json());
            const rules = data.map((file) => ({
                name: file.name,
                download_url: file.download_url,
            }));
            cache.set(RULES_CACHE_KEY, rules);
        }
        catch (error) {
            console.error('Cache update failed:', error);
        }
    };
    if (cachedRules) {
        updateCache();
        return cachedRules;
    }
    await updateCache();
    return cache.get(RULES_CACHE_KEY);
}
async function fetchCursorRuleContent(ruleName, filePath, onProgress) {
    const url = `${REPO_API_URL}/${ruleName}/.cursorrules`;
    const initialResponse = await fetch(url);
    if (!initialResponse.ok) {
        throw new Error(`HTTP error! Status: ${initialResponse.status}`);
    }
    const initialData = (await initialResponse.json());
    const downloadUrl = initialData.download_url;
    const response = await fetch(downloadUrl);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const totalLength = parseInt(response.headers.get('content-length') || '0', 10);
    let downloaded = 0;
    const writer = fs.createWriteStream(filePath);
    // Get response as array buffer and write to file
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Failed to get response reader');
    }
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        downloaded += value.length;
        writer.write(Buffer.from(value));
        if (totalLength) {
            const progress = (downloaded / totalLength) * 100;
            onProgress(Math.round(progress));
        }
    }
    writer.end();
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
//# sourceMappingURL=github.js.map