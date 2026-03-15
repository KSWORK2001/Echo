import { STORAGE_KEYS } from "@/config";
import { ProfileData } from "@/types";
import { safeLocalStorage } from "./helper";

export const MAX_PROFILE_SUMMARY_CHARS = 4000;
export const MAX_PROFILE_RESUME_CHARS = 12000;
export const MAX_PROFILE_CONTEXT_CHARS = 12000;

const clampText = (value: string, maxLength: number) =>
  value.trim().slice(0, maxLength);

const normalizeProfile = (profile: ProfileData): ProfileData => ({
  ...profile,
  summary: clampText(profile.summary || "", MAX_PROFILE_SUMMARY_CHARS),
  resumeText: clampText(profile.resumeText || "", MAX_PROFILE_RESUME_CHARS),
  generatedProfile:
    profile.generatedProfile && typeof profile.generatedProfile === "object"
      ? profile.generatedProfile
      : null,
});

export const getProfile = (): ProfileData | null => {
  try {
    const stored = safeLocalStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return normalizeProfile({
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      resumeText:
        typeof parsed.resumeText === "string" ? parsed.resumeText : "",
      resumeFile: parsed.resumeFile ?? null,
      generatedProfile:
        parsed.generatedProfile && typeof parsed.generatedProfile === "object"
          ? parsed.generatedProfile
          : null,
      createdAt:
        typeof parsed.createdAt === "number" ? parsed.createdAt : Date.now(),
      updatedAt:
        typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    });
  } catch (error) {
    console.error("Failed to read profile from storage:", error);
    return null;
  }
};

export const setProfile = (profile: ProfileData): void => {
  try {
    const normalized = normalizeProfile(profile);
    safeLocalStorage.setItem(
      STORAGE_KEYS.PROFILE,
      JSON.stringify(normalized)
    );
  } catch (error) {
    console.error("Failed to save profile:", error);
  }
};

export const updateProfile = (updates: Partial<ProfileData>): ProfileData => {
  const current = getProfile();
  const now = Date.now();
  const next: ProfileData = normalizeProfile({
    summary: updates.summary ?? current?.summary ?? "",
    resumeText: updates.resumeText ?? current?.resumeText ?? "",
    resumeFile:
      updates.resumeFile !== undefined
        ? updates.resumeFile
        : current?.resumeFile ?? null,
    generatedProfile:
      updates.generatedProfile !== undefined
        ? updates.generatedProfile
        : current?.generatedProfile ?? null,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  });

  setProfile(next);
  return next;
};

export const clearProfile = (): void => {
  safeLocalStorage.removeItem(STORAGE_KEYS.PROFILE);
};

export const buildProfileContext = (profile: ProfileData | null): string => {
  if (!profile) return "";

  const summary = clampText(profile.summary || "", MAX_PROFILE_SUMMARY_CHARS);
  const resumeText = clampText(
    profile.resumeText || "",
    MAX_PROFILE_CONTEXT_CHARS
  );
  const lines: string[] = [];

  if (summary) {
    lines.push(`Profile summary: ${summary}`);
  }

  if (resumeText) {
    lines.push(`Resume details: ${resumeText}`);
  } else if (profile.generatedProfile) {
    lines.push(
      `Structured profile JSON: ${JSON.stringify(profile.generatedProfile).slice(0, MAX_PROFILE_CONTEXT_CHARS)}`
    );
  } else if (profile.resumeFile?.name) {
    lines.push(
      `Resume file uploaded (${profile.resumeFile.name}), but no readable text was extracted yet.`
    );
  }

  if (!lines.length) {
    return "";
  }

  return `User profile context (always use to answer as the user):\n${lines.join(
    "\n\n"
  )}`;
};

export const getProfileContext = (): string =>
  buildProfileContext(getProfile());
