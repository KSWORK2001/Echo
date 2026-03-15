import { useEffect, useMemo, useState } from "react";
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
  getProfile,
  MAX_PROFILE_RESUME_CHARS,
  MAX_PROFILE_SUMMARY_CHARS,
  updateProfile,
} from "@/lib";
import { ProfileData, ProfileFile } from "@/types";
import {
  Copy,
  Download,
  FileJson,
  FileText,
  Save,
  Trash2,
  UploadCloud,
  UserRound,
} from "lucide-react";

const ACCEPTED_RESUME_TYPES =
  ".pdf,.doc,.docx,.txt,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

const Profile = () => {
  const [summary, setSummary] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<ProfileFile | null>(null);
  const [storedProfile, setStoredProfile] = useState<ProfileData | null>(null);
  const [status, setStatus] = useState<{
    type: "idle" | "saved" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [uploadNote, setUploadNote] = useState<string>("");

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setStoredProfile(profile);
      setSummary(profile.summary || "");
      setResumeText(profile.resumeText || "");
      setResumeFile(profile.resumeFile ?? null);
    }
  }, []);

  const hasProfile = Boolean(
    summary.trim() || resumeText.trim() || resumeFile?.name
  );

  const hasChanges =
    summary !== (storedProfile?.summary ?? "") ||
    resumeText !== (storedProfile?.resumeText ?? "") ||
    (resumeFile?.name ?? "") !== (storedProfile?.resumeFile?.name ?? "") ||
    (resumeFile?.type ?? "") !== (storedProfile?.resumeFile?.type ?? "") ||
    (resumeFile?.size ?? 0) !== (storedProfile?.resumeFile?.size ?? 0);

  const previewProfile = useMemo<ProfileData>(
    () => ({
      summary: summary.trim(),
      resumeText: resumeText.trim(),
      resumeFile: resumeFile ?? null,
      createdAt: storedProfile?.createdAt ?? Date.now(),
      updatedAt: storedProfile?.updatedAt ?? Date.now(),
    }),
    [summary, resumeText, resumeFile, storedProfile]
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

  const handleResumeUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResumeFile({
      name: file.name,
      type: file.type || "unknown",
      size: file.size,
    });
    setUploadNote("");

    const isText =
      file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");

    if (isText) {
      const text = await file.text();
      const clipped = text.slice(0, MAX_PROFILE_RESUME_CHARS);
      setResumeText(clipped);
      setUploadNote(
        "Text extracted from the file. Review it below before saving."
      );
    } else {
      setUploadNote(
        "PDF/DOCX parsing isn't available yet. Paste resume text below for best results."
      );
    }

    event.target.value = "";
  };

  const summaryRemaining = MAX_PROFILE_SUMMARY_CHARS - summary.length;
  const resumeRemaining = MAX_PROFILE_RESUME_CHARS - resumeText.length;
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
