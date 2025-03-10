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
exports.addCursorRuleCommand = addCursorRuleCommand;
const vscode = __importStar(require("vscode"));
const github_1 = require("../utils/github");
const path = __importStar(require("path"));
async function addCursorRuleCommand(context) {
    try {
        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = 'Loading...';
        quickPick.show();
        let rules = [];
        try {
            rules = await (0, github_1.fetchCursorRulesList)(context);
        }
        catch (error) {
            vscode.window.showErrorMessage('Error loading rules list.');
            quickPick.hide();
            return;
        }
        const ruleNames = rules.map((rule) => rule.name);
        quickPick.items = ruleNames.map((name) => ({ label: name }));
        quickPick.placeholder = 'Select a rule file';
        const selected = await new Promise((resolve) => {
            quickPick.onDidAccept(() => {
                const selection = quickPick.selectedItems[0]?.label;
                resolve(selection);
                quickPick.hide();
            });
            quickPick.onDidHide(() => {
                resolve(undefined);
            });
        });
        if (!selected) {
            vscode.window.showInformationMessage('No rules selected.');
            return;
        }
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Please open a workspace first.');
            return;
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const filePath = path.join(workspacePath, '.cursorrules');
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Downloading ${selected}...`,
            cancellable: false,
        }, async (progress) => {
            await (0, github_1.fetchCursorRuleContent)(selected, filePath, (percent) => {
                progress.report({ increment: percent });
            });
        });
        vscode.window.showInformationMessage(`.cursorrules file added to ${workspacePath}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error adding rule file: ${error}`);
    }
}
//# sourceMappingURL=add.js.map