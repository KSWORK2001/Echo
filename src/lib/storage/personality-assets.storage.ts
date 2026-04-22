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
const PDF_METADATA_REGEX =
  /^(obj|endobj|xref|trailer|stream|endstream|catalog|pages|font|procset|length|filter)$/i;

const decodeBase64Text = (base64: string): string => {
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
};

const decodePdfLiteralString = (literal: string): string => {
  let result = "";

  for (let i = 0; i < literal.length; i += 1) {
    const char = literal[i];

    if (char !== "\\") {
      result += char;
      continue;
    }

    const next = literal[i + 1];
    if (!next) {
      break;
    }

    if (/[0-7]/.test(next)) {
      const octal = literal.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] || "";
      if (octal) {
        result += String.fromCharCode(parseInt(octal, 8));
        i += octal.length;
        continue;
      }
    }

    const escapeMap: Record<string, string> = {
      n: "\n",
      r: "\r",
      t: "\t",
      b: "\b",
      f: "\f",
      "(": "(",
      ")": ")",
      "\\": "\\",
    };

    result += escapeMap[next] ?? next;
    i += 1;
  }

  return result;
};

const normalizeExtractedText = (value: string): string =>
  value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractReadableFragmentsFromBinary = (
  base64: string,
  maxChars: number
): string => {
  try {
    const source = atob(base64);
    const matches = source.match(/[A-Za-z0-9][A-Za-z0-9\s.,;:()\[\]{}'"/\\@&+_-]{25,}/g) || [];

    const fragments: string[] = [];
    const seen = new Set<string>();
    let usedChars = 0;

    for (const match of matches) {
      const cleaned = normalizeExtractedText(match);
      if (!cleaned) {
        continue;
      }

      const lowered = cleaned.toLowerCase();
      if (seen.has(lowered) || PDF_METADATA_REGEX.test(lowered)) {
        continue;
      }

      seen.add(lowered);
      const clipped = cleaned.slice(0, Math.max(0, maxChars - usedChars));
      if (!clipped) {
        break;
      }

      fragments.push(clipped);
      usedChars += clipped.length;
      if (usedChars >= maxChars) {
        break;
      }
    }

    return fragments.join(" ");
  } catch {
    return "";
  }
};

const extractPdfTextFromBase64 = (base64: string, maxChars: number): string => {
  try {
    const source = atob(base64);
    const fragments: string[] = [];
    const seen = new Set<string>();
    let usedChars = 0;

    for (const match of source.matchAll(/\((?:\\.|[^()\\]){4,}\)/g)) {
      if (usedChars >= maxChars) {
        break;
      }

      const decoded = normalizeExtractedText(
        decodePdfLiteralString(match[0].slice(1, -1))
      );

      if (!decoded) {
        continue;
      }

      const lowered = decoded.toLowerCase();
      if (seen.has(lowered) || PDF_METADATA_REGEX.test(lowered)) {
        continue;
      }

      seen.add(lowered);
      const clipped = decoded.slice(0, Math.max(0, maxChars - usedChars));
      if (!clipped) {
        break;
      }

      fragments.push(clipped);
      usedChars += clipped.length;
    }

    const extracted = fragments.join(" ").trim();
    if (extracted) {
      return extracted;
    }

    return extractReadableFragmentsFromBinary(base64, maxChars);
  } catch {
    return "";
  }
};

const extractDocumentText = (file: PersonalityAsset, maxChars: number): string => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  if (fileType === "text/plain" || fileName.endsWith(".txt")) {
    return decodeBase64Text(file.base64).trim().slice(0, maxChars);
  }

  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    return extractPdfTextFromBase64(file.base64, maxChars);
  }

  return extractReadableFragmentsFromBinary(file.base64, maxChars);
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

    const extracted = extractDocumentText(
      file,
      Math.min(MAX_TEXT_ATTACHMENT_CHARS, remainingChars)
    );

    if (extracted) {
      const clipped = extracted.slice(0, Math.min(MAX_TEXT_ATTACHMENT_CHARS, remainingChars));
      remainingChars -= clipped.length;

      lines.push(`- ${file.name} (${file.type || "unknown"}):`);
      lines.push(clipped);
    } else {
      lines.push(
        `- ${file.name} (${file.type || "unknown"}) attached for reference. Could not extract readable local text from this file.`
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
