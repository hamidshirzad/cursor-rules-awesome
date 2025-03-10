import * as fs from 'fs';
import { Cache } from './cache';
import * as vscode from 'vscode';

export interface Rule {
  name: string;
  download_url: string;
}

const REPO_API_URL = 'https://api.github.com/repos/dawamr/awesome-cursorrules/contents/rules';

const RULES_CACHE_KEY = 'cursor_rules_list';

type GitHubFileResponse = {
  name: string;
  download_url: string;
};

export async function fetchCursorRulesList(context: vscode.ExtensionContext): Promise<Rule[]> {
  const cache = Cache.getInstance(context);
  const cachedRules = cache.get<Rule[]>(RULES_CACHE_KEY);

  const updateCache = async () => {
    try {
      const response = await fetch(REPO_API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = (await response.json()) as GitHubFileResponse[];

      const rules: Rule[] = data.map((file) => ({
        name: file.name,
        download_url: file.download_url,
      }));
      cache.set(RULES_CACHE_KEY, rules);
    } catch (error) {
      console.error('Cache update failed:', error);
    }
  };

  if (cachedRules) {
    updateCache();
    return cachedRules;
  }

  await updateCache();
  return cache.get<Rule[]>(RULES_CACHE_KEY)!;
}

export async function fetchCursorRuleContent(
  ruleName: string,
  filePath: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  const url = `${REPO_API_URL}/${ruleName}/.cursorrules`;
  const initialResponse = await fetch(url);
  if (!initialResponse.ok) {
    throw new Error(`HTTP error! Status: ${initialResponse.status}`);
  }
  const initialData = (await initialResponse.json()) as GitHubFileResponse;
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
    if (done) break;

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
