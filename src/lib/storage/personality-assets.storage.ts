import { STORAGE_KEYS } from "@/config";
import { safeLocalStorage } from "@/lib";

export interface PersonalityAsset {
  id: string;
  name: string;
  type: string;
  base64: string;
  size: number;
}

type PersonalityAssetsMap = Record<string, PersonalityAsset[]>;

const MAX_TEXT_ATTACHMENT_CHARS = 12_000;
const MAX_TOTAL_ATTACHMENT_CONTEXT_CHARS = 24_000;

const decodeBase64Text = (base64: string): string => {
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
};

export const getAllPersonalityAssets = (): PersonalityAssetsMap => {
  const raw = safeLocalStorage.getItem(STORAGE_KEYS.PERSONALITY_ASSETS);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as PersonalityAssetsMap;
  } catch {
    return {};
  }
};

export const getPersonalityAssets = (promptId: number | string): PersonalityAsset[] => {
  const all = getAllPersonalityAssets();
  const key = String(promptId);
  return Array.isArray(all[key]) ? all[key] : [];
};

export const setPersonalityAssets = (
  promptId: number | string,
  assets: PersonalityAsset[]
): void => {
  const all = getAllPersonalityAssets();
  const key = String(promptId);
  all[key] = assets;
  safeLocalStorage.setItem(STORAGE_KEYS.PERSONALITY_ASSETS, JSON.stringify(all));
};

export const removePersonalityAssets = (promptId: number | string): void => {
  const all = getAllPersonalityAssets();
  const key = String(promptId);
  delete all[key];
  safeLocalStorage.setItem(STORAGE_KEYS.PERSONALITY_ASSETS, JSON.stringify(all));
};

export const getSelectedPersonalityAssets = (): PersonalityAsset[] => {
  const selectedPromptId = safeLocalStorage.getItem(
    STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID
  );

  if (!selectedPromptId) {
    return [];
  }

  return getPersonalityAssets(selectedPromptId);
};

export const buildPersonalityAssetsContext = (
  assets: PersonalityAsset[]
): string => {
  const nonImageFiles = assets.filter((file) => !file.type.startsWith("image/"));
  if (nonImageFiles.length === 0) {
    return "";
  }

  const lines: string[] = [
    "Selected personality reference files (always use when relevant):",
  ];
  let remainingChars = MAX_TOTAL_ATTACHMENT_CONTEXT_CHARS;

  nonImageFiles.forEach((file) => {
    if (remainingChars <= 0) {
      return;
    }

    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const decoded = decodeBase64Text(file.base64).trim();
      const clipped = decoded.slice(
        0,
        Math.min(MAX_TEXT_ATTACHMENT_CHARS, remainingChars)
      );
      remainingChars -= clipped.length;

      lines.push(`- ${file.name} (text/plain):`);
      lines.push(clipped || "[Text file was empty or could not be decoded]");
    } else {
      lines.push(
        `- ${file.name} (${file.type || "unknown"}) attached for reference. Binary document content is not parsed in-app yet.`
      );
    }
  });

  return lines.join("\n");
};

export const getSelectedPersonalityContextBundle = (): {
  textContext: string;
  imagesBase64: string[];
} => {
  const assets = getSelectedPersonalityAssets();
  const textContext = buildPersonalityAssetsContext(assets);
  const imagesBase64 = assets
    .filter((file) => file.type.startsWith("image/"))
    .map((file) => file.base64);

  return { textContext, imagesBase64 };
};
