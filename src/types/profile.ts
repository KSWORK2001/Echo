export interface ProfileFile {
  name: string;
  type: string;
  size: number;
}

export interface ProfileData {
  summary: string;
  resumeText: string;
  resumeFile?: ProfileFile | null;
  createdAt: number;
  updatedAt: number;
}
