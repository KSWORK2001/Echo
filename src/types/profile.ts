export interface ProfileFile {
  name: string;
  type: string;
  size: number;
}

export interface ProfileData {
  summary: string;
  resumeText: string;
  resumeFile?: ProfileFile | null;
  generatedProfile?: Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
}
