import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from "@/components";
import { PageLayout } from "@/layouts";
import {
  buildProfileContext,
  clearProfile,
  fetchAIResponse,
  getProfile,
  MAX_PROFILE_RESUME_CHARS,
  MAX_PROFILE_SUMMARY_CHARS,
  updateProfile,
} from "@/lib";
import { useApp } from "@/contexts";
import { ProfileData, ProfileFile } from "@/types";
import {
  Copy,
  Download,
  FileJson,
  FileText,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  UserRound,
} from "lucide-react";

const ACCEPTED_RESUME_TYPES =
  ".pdf,.doc,.docx,.txt,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BUILD_PROFILE_FILE_BASE64_CHARS = 100_000;
const MAX_BINARY_EXTRACTED_TEXT_CHARS = 24_000;
const PDF_LITERAL_MIN_LENGTH = 10;
const PDF_METADATA_REGEX =
  /(pdftex|linearized|\/type\s*\/(?:page|catalog|pages)|\/mediabox|\/flatedecode|\/creationdate|\/moddate|\/producer|\/creator|\/root|\/annots|\/contents|\/outlines|endobj|xref|trailer|startxref|\/pt[e]?x\.fullbanner)/i;

const PROFILE_BUILDER_SYSTEM_PROMPT = `You are a strict JSON generator. Convert resume input into profile JSON.

Return only valid JSON with no markdown code fences.
Extract as much resume detail as possible.
Important rules:
- Capture ALL education entries you can find.
- Capture ALL work experience entries you can find.
- Capture ALL certifications and projects you can find.
- Do not collapse multiple entries into a single item.
Schema:
{
  "summary": "Short first-person summary",
  "resumeText": "Detailed resume notes in plain text",
  "generatedProfile": {
    "fullName": "string",
    "headline": "string",
    "skills": ["string"],
    "experience": [
      {
        "company": "string",
        "title": "string",
        "dates": "string",
        "highlights": ["string"]
      }
    ],
    "education": ["string"],
    "projects": ["string"],
    "certifications": ["string"]
  }
}

If data is missing, use empty string/array values.`;

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${
    units[exponent]
  }`;
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string)?.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
  });

const normalizeExtractedPdfText = (value: string): string =>
  value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isMeaningfulPdfText = (value: string): boolean => {
  const normalized = normalizeExtractedPdfText(value);
  if (normalized.length < 2) return false;
  if (PDF_METADATA_REGEX.test(normalized)) return false;

  const letters = (normalized.match(/[A-Za-z]/g) || []).length;
  const digits = (normalized.match(/[0-9]/g) || []).length;
  return letters + digits >= 2;
};

const isLikelyHumanText = (value: string): boolean => {
  if (value.length < 20) return false;

  const letters = (value.match(/[A-Za-z]/g) || []).length;
  const printable = (value.match(/[A-Za-z0-9\s.,;:()\[\]{}'"/\\@&+_-]/g) || [])
    .length;

  if (letters < 8) return false;
  if (printable / value.length < 0.7) return false;

  const lower = value.toLowerCase();
  if (
    lower.includes("endobj") ||
    lower.includes("xref") ||
    lower.includes("obj") ||
    lower.includes("stream") ||
    lower.includes("flatedecode") ||
    PDF_METADATA_REGEX.test(value)
  ) {
    return false;
  }

  const slashCount = (value.match(/\//g) || []).length;
  if (slashCount > Math.max(3, Math.floor(value.length / 20))) {
    return false;
  }

  return true;
};

const decodePdfLiteralString = (value: string): string => {
  let result = "";

  for (let i = 0; i < value.length; i += 1) {
    const current = value[i];
    if (current !== "\\") {
      result += current;
      continue;
    }

    const next = value[i + 1];
    if (!next) {
      continue;
    }

    if (next === "n") {
      result += "\n";
      i += 1;
      continue;
    }
    if (next === "r") {
      result += "\r";
      i += 1;
      continue;
    }
    if (next === "t") {
      result += "\t";
      i += 1;
      continue;
    }
    if (next === "b") {
      result += "\b";
      i += 1;
      continue;
    }
    if (next === "f") {
      result += "\f";
      i += 1;
      continue;
    }
    if (next === "(" || next === ")" || next === "\\") {
      result += next;
      i += 1;
      continue;
    }

    if (/[0-7]/.test(next)) {
      let octal = next;
      let cursor = i + 2;
      while (cursor < value.length && octal.length < 3 && /[0-7]/.test(value[cursor])) {
        octal += value[cursor];
        cursor += 1;
      }

      result += String.fromCharCode(parseInt(octal, 8));
      i += octal.length;
      continue;
    }

    if (next === "\n" || next === "\r") {
      i += 1;
      if (next === "\r" && value[i + 1] === "\n") {
        i += 1;
      }
      continue;
    }

    result += next;
    i += 1;
  }

  return result;
};

const collectPdfOperatorFragments = (
  source: string,
  target: string[]
): void => {
  const textBlockRegex = /BT[\s\S]*?ET/g;
  const tjArrayRegex = /\[[\s\S]*?\]\s*TJ/g;
  const literalRegex = /\((?:\\.|[^\\()])*\)/g;
  const simpleTextRegex = /\((?:\\.|[^\\()])*\)\s*(?:Tj|'|")/g;

  for (const blockMatch of source.matchAll(textBlockRegex)) {
    const block = blockMatch[0];

    for (const arrayMatch of block.matchAll(tjArrayRegex)) {
      const literals = arrayMatch[0].match(literalRegex) || [];
      if (!literals.length) {
        continue;
      }

      const combined = literals
        .map((literal) =>
          normalizeExtractedPdfText(
            decodePdfLiteralString(literal.slice(1, -1))
          )
        )
        .join("")
        .trim();

      if (isMeaningfulPdfText(combined)) {
        target.push(combined);
      }
    }

    for (const simpleMatch of block.matchAll(simpleTextRegex)) {
      const literalOnly = simpleMatch[0].replace(/\s*(?:Tj|'|")$/, "");
      if (!literalOnly.startsWith("(") || !literalOnly.endsWith(")")) {
        continue;
      }

      const decoded = normalizeExtractedPdfText(
        decodePdfLiteralString(literalOnly.slice(1, -1))
      );
      if (isMeaningfulPdfText(decoded)) {
        target.push(decoded);
      }
    }
  }
};

const collectReadableFragments = (
  source: string,
  target: string[]
): void => {
  const literalRegex = new RegExp(
    `\\((?:\\\\.|[^\\\\()]){${PDF_LITERAL_MIN_LENGTH},}\\)`,
    "g"
  );
  for (const match of source.matchAll(literalRegex)) {
    const decoded = normalizeExtractedPdfText(
      decodePdfLiteralString(match[0].slice(1, -1))
    );

    if (
      !decoded ||
      !isMeaningfulPdfText(decoded) ||
      !isLikelyHumanText(decoded)
    ) {
      continue;
    }

    target.push(decoded);
  }

  const readableRegex = /[A-Za-z0-9][A-Za-z0-9\s.,;:()\[\]{}'"/\\@&+_-]{25,}/g;
  for (const match of source.matchAll(readableRegex)) {
    const cleaned = normalizeExtractedPdfText(match[0]);
    if (
      !cleaned ||
      !isMeaningfulPdfText(cleaned) ||
      !isLikelyHumanText(cleaned)
    ) {
      continue;
    }

    target.push(cleaned);
  }
};

const inflateDeflateBytes = async (bytes: Uint8Array): Promise<string> => {
  if (typeof DecompressionStream === "undefined") {
    return "";
  }

  try {
    const byteBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    const stream = new Blob([byteBuffer])
      .stream()
      .pipeThrough(new DecompressionStream("deflate"));
    const inflated = await new Response(stream).arrayBuffer();
    return new TextDecoder("latin1").decode(inflated);
  } catch {
    return "";
  }
};

const extractPdfTextHeuristic = async (file: File): Promise<string> => {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const raw = new TextDecoder("latin1").decode(bytes);
    const operatorFragments: string[] = [];
    const fallbackFragments: string[] = [];

    collectPdfOperatorFragments(raw, operatorFragments);
    collectReadableFragments(raw, fallbackFragments);

    const streamRegex = /<<[\s\S]*?>>\s*stream\r?\n/g;
    let streamMatch = streamRegex.exec(raw);
    while (streamMatch) {
      const dict = streamMatch[0];
      const streamStart = streamRegex.lastIndex;
      const endStreamIndex = raw.indexOf("endstream", streamStart);
      if (endStreamIndex === -1) {
        break;
      }

      let streamEnd = endStreamIndex;
      if (raw[streamEnd - 1] === "\n") {
        streamEnd -= 1;
      }
      if (raw[streamEnd - 1] === "\r") {
        streamEnd -= 1;
      }

      if (streamEnd > streamStart) {
        const streamBytes = bytes.slice(streamStart, streamEnd);
        const streamText = /\/FlateDecode/i.test(dict)
          ? await inflateDeflateBytes(streamBytes)
          : new TextDecoder("latin1").decode(streamBytes);

        if (streamText) {
          collectPdfOperatorFragments(streamText, operatorFragments);
          collectReadableFragments(streamText, fallbackFragments);
        }
      }

      streamRegex.lastIndex = endStreamIndex + "endstream".length;
      streamMatch = streamRegex.exec(raw);
    }

    const sourceFragments =
      operatorFragments.length >= 10
        ? operatorFragments
        : [...operatorFragments, ...fallbackFragments];

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const fragment of sourceFragments) {
      const normalized = normalizeExtractedPdfText(fragment);
      if (!normalized) {
        continue;
      }

      if (!isMeaningfulPdfText(normalized)) {
        continue;
      }

      const key = normalized.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(normalized);
    }

    return unique.join("\n").slice(0, MAX_BINARY_EXTRACTED_TEXT_CHARS);
  } catch {
    return "";
  }
};

const buildBase64PromptPayload = (
  value: string
): { payload: string; truncated: boolean } => {
  if (value.length <= MAX_BUILD_PROFILE_FILE_BASE64_CHARS) {
    return {
      payload: value,
      truncated: false,
    };
  }

  const headChars = Math.floor(MAX_BUILD_PROFILE_FILE_BASE64_CHARS / 2);
  const tailChars = MAX_BUILD_PROFILE_FILE_BASE64_CHARS - headChars;

  return {
    payload: `${value.slice(0, headChars)}\n...[middle omitted to fit prompt size]...\n${value.slice(-tailChars)}`,
    truncated: true,
  };
};

const parseJsonFromModelResponse = (
  value: string
): Record<string, unknown> | null => {
  const trimmed = value.trim();
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (codeBlockMatch?.[1] || trimmed).trim();

  const tryParse = (input: string) => {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  };

  const direct = tryParse(candidate);
  if (direct) return direct;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return tryParse(candidate.slice(start, end + 1));
  }

  return null;
};

const getBestString = (
  profile: Record<string, unknown>,
  keys: string[]
): string => {
  for (const key of keys) {
    const value = profile[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (Array.isArray(value)) {
      const stringItems = value
        .filter((item): item is string => typeof item === "string")
        .join("\n")
        .trim();
      if (stringItems) {
        return stringItems;
      }
    }
  }

  return "";
};

const formatGeneratedProfileDraft = (
  value: Record<string, unknown> | null
): string => (value ? JSON.stringify(value, null, 2) : "");

const Profile = () => {
  const { selectedAIProvider, allAiProviders } = useApp();
  const [summary, setSummary] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<ProfileFile | null>(null);
  const [storedProfile, setStoredProfile] = useState<ProfileData | null>(null);
  const [status, setStatus] = useState<{
    type: "idle" | "saved" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [uploadNote, setUploadNote] = useState<string>("");
  const [resumeFileBase64, setResumeFileBase64] = useState("");
  const [generatedProfile, setGeneratedProfile] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [generatedProfileDraft, setGeneratedProfileDraft] = useState("");
  const [generatedProfileDraftError, setGeneratedProfileDraftError] =
    useState("");
  const [isBuildingProfile, setIsBuildingProfile] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setStoredProfile(profile);
      setSummary(profile.summary || "");
      setResumeText(profile.resumeText || "");
      setResumeFile(profile.resumeFile ?? null);
      const loadedGeneratedProfile = profile.generatedProfile ?? null;
      setGeneratedProfile(loadedGeneratedProfile);
      setGeneratedProfileDraft(
        formatGeneratedProfileDraft(loadedGeneratedProfile)
      );
      setGeneratedProfileDraftError("");
    }
  }, []);

  const hasProfile = Boolean(
    summary.trim() || resumeText.trim() || resumeFile?.name || generatedProfile
  );

  const hasGeneratedProfileChanges = useMemo(
    () =>
      JSON.stringify(generatedProfile ?? null) !==
      JSON.stringify(storedProfile?.generatedProfile ?? null),
    [generatedProfile, storedProfile?.generatedProfile]
  );

  const hasChanges =
    summary !== (storedProfile?.summary ?? "") ||
    resumeText !== (storedProfile?.resumeText ?? "") ||
    (resumeFile?.name ?? "") !== (storedProfile?.resumeFile?.name ?? "") ||
    (resumeFile?.type ?? "") !== (storedProfile?.resumeFile?.type ?? "") ||
    (resumeFile?.size ?? 0) !== (storedProfile?.resumeFile?.size ?? 0) ||
    hasGeneratedProfileChanges;

  const previewProfile = useMemo<ProfileData>(
    () => ({
      summary: summary.trim(),
      resumeText: resumeText.trim(),
      resumeFile: resumeFile ?? null,
      generatedProfile,
      createdAt: storedProfile?.createdAt ?? Date.now(),
      updatedAt: storedProfile?.updatedAt ?? Date.now(),
    }),
    [summary, resumeText, resumeFile, generatedProfile, storedProfile]
  );

  const profileContext = useMemo(
    () => buildProfileContext(previewProfile),
    [previewProfile]
  );

  const profileJson = useMemo(
    () => JSON.stringify(previewProfile, null, 2),
    [previewProfile]
  );

  const handleSave = () => {
    const saved = updateProfile({
      summary,
      resumeText,
      resumeFile: resumeFile ?? null,
      generatedProfile,
    });
    setStoredProfile(saved);
    setStatus({ type: "saved", message: "Profile saved." });
    setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
  };

  const handleClear = () => {
    clearProfile();
    setSummary("");
    setResumeText("");
    setResumeFile(null);
    setResumeFileBase64("");
    setGeneratedProfile(null);
    setGeneratedProfileDraft("");
    setGeneratedProfileDraftError("");
    setStoredProfile(null);
    setStatus({ type: "saved", message: "Profile cleared." });
    setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(profileJson);
      setStatus({ type: "saved", message: "Profile JSON copied." });
      setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
    } catch (error) {
      setStatus({
        type: "error",
        message: "Clipboard access unavailable. Try download instead.",
      });
    }
  };

  const handleDownloadJson = () => {
    if (!hasProfile) return;
    try {
      const blob = new Blob([profileJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "profile.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setStatus({
        type: "error",
        message: "Failed to download profile.json.",
      });
    }
  };

  const handleResumeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResumeFile({
      name: file.name,
      type: file.type || "unknown",
      size: file.size,
    });
    setUploadNote("");
    setStatus({ type: "idle", message: "" });
    setGeneratedProfile(null);
    setGeneratedProfileDraft("");
    setGeneratedProfileDraftError("");

    try {
      const base64 = await fileToBase64(file);
      setResumeFileBase64(base64);
    } catch {
      setResumeFileBase64("");
      setUploadNote("Could not read the file. Try uploading it again.");
    }

    const lowerFileName = file.name.toLowerCase();
    const isText =
      file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    const isPdf = file.type === "application/pdf" || lowerFileName.endsWith(".pdf");

    if (isText) {
      const text = await file.text();
      const clipped = text.slice(0, MAX_PROFILE_RESUME_CHARS);
      setResumeText(clipped);
      setUploadNote(
        "Text extracted from the file. You can click Build Profile or edit it manually below."
      );
    } else if (isPdf) {
      const extracted = await extractPdfTextHeuristic(file);
      if (extracted) {
        const clipped = extracted.slice(0, MAX_PROFILE_RESUME_CHARS);
        setResumeText(clipped);
        setUploadNote(
          "Extracted readable text from your PDF. Click Build Profile to parse all experience, education, and certifications."
        );
      } else {
        setUploadNote(
          "PDF uploaded. Could not auto-extract enough text locally, but Build Profile will still use the file payload."
        );
      }
    } else {
      setUploadNote(
        "Resume uploaded. Click Build Profile to send it to AI and auto-generate profile JSON."
      );
    }

    event.target.value = "";
  };

  const handleGeneratedProfileDraftChange = (value: string) => {
    setGeneratedProfileDraft(value);

    const trimmed = value.trim();
    if (!trimmed) {
      setGeneratedProfile(null);
      setGeneratedProfileDraftError("");
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setGeneratedProfileDraftError(
          "Generated profile must be a valid JSON object."
        );
        return;
      }

      setGeneratedProfile(parsed as Record<string, unknown>);
      setGeneratedProfileDraftError("");
    } catch {
      setGeneratedProfileDraftError(
        "Invalid JSON. Fix formatting to apply generated profile edits."
      );
    }
  };

  const handleBuildProfile = async () => {
    if (!resumeFile) {
      setStatus({
        type: "error",
        message: "Upload a resume file first.",
      });
      return;
    }

    if (!selectedAIProvider.provider) {
      setStatus({
        type: "error",
        message: "Please select an AI provider in settings.",
      });
      return;
    }

    const provider = allAiProviders.find(
      (item) => item.id === selectedAIProvider.provider
    );

    if (!provider) {
      setStatus({
        type: "error",
        message: "Invalid AI provider selected.",
      });
      return;
    }

    const { payload: base64Payload, truncated: isBase64Truncated } =
      buildBase64PromptPayload(resumeFileBase64);
    if (!base64Payload && !resumeText.trim()) {
      setStatus({
        type: "error",
        message: "Resume content is empty. Please upload the file again.",
      });
      return;
    }

    setIsBuildingProfile(true);
    setStatus({ type: "idle", message: "" });

    try {
      const messageParts = [
        "Create profile JSON from this resume data.",
        "Return only valid JSON.",
        `Resume file name: ${resumeFile.name}`,
        `Resume file type: ${resumeFile.type || "unknown"}`,
        `Resume file size (bytes): ${resumeFile.size}`,
        "Prioritize extracting complete education, work experience, certifications, and projects.",
        resumeText.trim()
          ? `User-provided resume text:\n${resumeText
              .trim()
              .slice(0, MAX_PROFILE_RESUME_CHARS)}`
          : "User-provided resume text: [none]",
        resumeFileBase64
          ? `Resume base64 (${isBase64Truncated ? "head+tail sample" : "full"}):\n${base64Payload}`
          : "Resume base64: [not available]",
      ];

      let modelResponse = "";
      for await (const chunk of fetchAIResponse({
        provider,
        selectedProvider: selectedAIProvider,
        systemPrompt: PROFILE_BUILDER_SYSTEM_PROMPT,
        useEnhancedSystemPrompt: false,
        history: [],
        userMessage: messageParts.join("\n\n"),
      })) {
        modelResponse += chunk;
      }

      const parsed = parseJsonFromModelResponse(modelResponse);
      if (!parsed) {
        throw new Error("AI did not return valid JSON. Please try again.");
      }

      const parsedSummary = getBestString(parsed, [
        "summary",
        "profileSummary",
        "bio",
      ]);
      const parsedResumeText = getBestString(parsed, [
        "resumeText",
        "resume",
        "details",
      ]);
      const parsedGeneratedProfile =
        parsed.generatedProfile &&
        typeof parsed.generatedProfile === "object" &&
        !Array.isArray(parsed.generatedProfile)
          ? (parsed.generatedProfile as Record<string, unknown>)
          : parsed;

      const saved = updateProfile({
        summary: parsedSummary || summary,
        resumeText: parsedResumeText || resumeText,
        resumeFile: resumeFile ?? null,
        generatedProfile: parsedGeneratedProfile,
      });

      setSummary(saved.summary);
      setResumeText(saved.resumeText);
      setGeneratedProfile(saved.generatedProfile ?? parsedGeneratedProfile);
      setGeneratedProfileDraft(
        formatGeneratedProfileDraft(
          saved.generatedProfile ?? parsedGeneratedProfile
        )
      );
      setGeneratedProfileDraftError("");
      setStoredProfile(saved);
      setUploadNote("Profile built from your resume. Review and edit if needed.");
      setStatus({ type: "saved", message: "Profile built and saved." });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to build profile from resume.",
      });
    } finally {
      setIsBuildingProfile(false);
    }
  };

  const summaryRemaining = MAX_PROFILE_SUMMARY_CHARS - summary.length;
  const resumeRemaining = MAX_PROFILE_RESUME_CHARS - resumeText.length;
  const canBuildProfile = Boolean(resumeFile) && !isBuildingProfile;
  const lastUpdated = storedProfile?.updatedAt
    ? new Date(storedProfile.updatedAt).toLocaleString()
    : "Not saved yet";

  return (
    <PageLayout
      title="Profile"
      description="Upload a resume or describe yourself so Echo always answers as you."
      rightSlot={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleSave}
            disabled={!hasChanges}
            title="Save profile"
          >
            <Save className="size-3" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={handleClear}
            disabled={!hasProfile}
            title="Clear profile"
          >
            <Trash2 className="size-3" />
            Clear
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="flex flex-col gap-6">
          <Card className="border-border/60 bg-background/70">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-foreground">
                  <UserRound className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm">Profile summary</CardTitle>
                  <CardDescription className="text-xs">
                    Write a quick, conversational summary about yourself.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Describe your background, strengths, and what you want Echo to represent..."
                className="min-h-[180px] resize-none border-1 border-input/50 focus:border-primary/50 transition-colors"
                value={summary}
                maxLength={MAX_PROFILE_SUMMARY_CHARS}
                onChange={(event) =>
                  setSummary(
                    event.target.value.slice(0, MAX_PROFILE_SUMMARY_CHARS)
                  )
                }
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Keep this concise and in your own voice.</span>
                <span>{summaryRemaining} characters left</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-background/70">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm">Resume upload</CardTitle>
                  <CardDescription className="text-xs">
                    Upload a resume or paste the text below.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <UploadCloud className="size-4 text-primary" />
                    Resume file
                  </div>
                  {resumeFile?.name ? (
                    <Badge variant="outline">
                      {resumeFile.name} ({formatBytes(resumeFile.size)})
                    </Badge>
                  ) : (
                    <Badge variant="outline">No file uploaded</Badge>
                  )}
                </div>
                <Input
                  type="file"
                  accept={ACCEPTED_RESUME_TYPES}
                  onChange={handleResumeUpload}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="w-fit gap-1.5 text-xs"
                  onClick={() => void handleBuildProfile()}
                  disabled={!canBuildProfile}
                >
                  {isBuildingProfile ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  {isBuildingProfile ? "Building profile..." : "Build Profile"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Supported: PDF, DOCX, DOC, TXT. Text files will auto-populate
                  the resume text.
                </p>
                {uploadNote ? (
                  <p className="text-xs text-primary/80">{uploadNote}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Resume text</p>
                  <span className="text-xs text-muted-foreground">
                    {resumeRemaining} characters left
                  </span>
                </div>
                <Textarea
                  placeholder="Paste resume text here so Echo can cite it in answers..."
                  className="min-h-[220px] resize-none border-1 border-input/50 focus:border-primary/50 transition-colors"
                  value={resumeText}
                  maxLength={MAX_PROFILE_RESUME_CHARS}
                  onChange={(event) =>
                    setResumeText(
                      event.target.value.slice(0, MAX_PROFILE_RESUME_CHARS)
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  This text is attached to every AI request. Keep it current and
                  relevant.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-border/60 bg-background/70">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-foreground">
                  <FileJson className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm">Profile status</CardTitle>
                  <CardDescription className="text-xs">
                    Changes here persist across sessions.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Last updated</span>
                <span className="font-medium text-foreground/80">
                  {lastUpdated}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={hasChanges ? "outline" : "default"}>
                  {hasChanges ? "Unsaved changes" : "Saved"}
                </Badge>
                {status.message ? (
                  <Badge
                    variant={status.type === "error" ? "destructive" : "default"}
                  >
                    {status.message}
                  </Badge>
                ) : null}
              </div>
              <p>
                Echo injects your profile into every AI request so answers stay
                aligned with your background.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-background/70">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm">Generated profile JSON</CardTitle>
                  <CardDescription className="text-xs">
                    Review or edit structured fields extracted from your resume.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={generatedProfileDraft}
                onChange={(event) =>
                  handleGeneratedProfileDraftChange(event.target.value)
                }
                placeholder='{"fullName":"","headline":"","skills":[]}'
                className="min-h-[220px] resize-none bg-muted/20 font-mono text-xs"
              />
              {generatedProfileDraftError ? (
                <p className="text-xs text-destructive">
                  {generatedProfileDraftError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Keep this as a JSON object. Valid edits are included in
                  profile.json and AI context.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-background/70">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm">AI context preview</CardTitle>
                  <CardDescription className="text-xs">
                    This is the exact profile context sent to the model.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                readOnly
                value={
                  profileContext ||
                  "No profile context yet. Add a summary or resume text."
                }
                className="min-h-[200px] resize-none bg-muted/20 text-xs"
              />
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-background/70">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm">profile.json</CardTitle>
                  <CardDescription className="text-xs">
                    Download or copy the stored profile payload.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={handleCopyJson}
                    disabled={!hasProfile}
                    title="Copy JSON"
                  >
                    <Copy className="size-3" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={handleDownloadJson}
                    disabled={!hasProfile}
                    title="Download profile.json"
                  >
                    <Download className="size-3" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                value={profileJson}
                className="min-h-[220px] resize-none font-mono text-xs bg-muted/20"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Profile;
