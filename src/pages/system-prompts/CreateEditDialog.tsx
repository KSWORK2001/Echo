import { ChangeEvent, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Textarea,
} from "@/components";
import { GenerateSystemPrompt } from "./Generate";
import { PaperclipIcon, SparklesIcon, Trash2Icon, FileIcon, ImageIcon } from "lucide-react";
import { PersonalityAsset } from "@/lib";

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(["pdf", "txt", "doc", "docx"]);

const isAllowedAttachmentFile = (file: File): boolean => {
  if (file.type.startsWith("image/")) {
    return true;
  }

  if (file.type && ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? ALLOWED_ATTACHMENT_EXTENSIONS.has(extension) : false;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface CreateEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    id?: number;
    name: string;
    prompt: string;
    assets: PersonalityAsset[];
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      id?: number;
      name: string;
      prompt: string;
      assets: PersonalityAsset[];
    }>
  >;
  onSave: () => void | Promise<void>;
  onGenerate: (prompt: string, promptName: string) => void;
  isEditing?: boolean;
  isSaving?: boolean;
}

export const CreateEditDialog = ({
  isOpen,
  onOpenChange,
  form,
  setForm,
  onSave,
  onGenerate,
  isEditing = false,
  isSaving = false,
}: CreateEditDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isFormValid = form.name.trim() && form.prompt.trim();

  const handleSave = async () => {
    await onSave();
  };

  const handleAssetSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(isAllowedAttachmentFile);

    const processed = await Promise.all(
      validFiles.map(async (file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: file.type || "application/octet-stream",
        base64: await fileToBase64(file),
        size: file.size,
      }))
    );

    setForm((prev) => ({
      ...prev,
      assets: [...prev.assets, ...processed],
    }));

    e.target.value = "";
  };

  const removeAsset = (assetId: string) => {
    setForm((prev) => ({
      ...prev,
      assets: prev.assets.filter((asset) => asset.id !== assetId),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="mt-4 px-6 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {isEditing ? "Edit Personality" : "Create Personality"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isEditing
                  ? "Update your personality details below."
                  : "Define a new AI behavior and personality."}
              </DialogDescription>
            </div>
            <GenerateSystemPrompt onGenerate={onGenerate} />
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4 px-6 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Name
            </label>
            <Input
              placeholder="e.g., Code Review Expert, Creative Writer..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isSaving}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Personality Instructions
            </label>
            <Textarea
              placeholder="I am Echo, your AI assistant. I give concise, accurate, friendly answers you can say out loud naturally..."
              className="min-h-[200px] max-h-[400px] resize-none overflow-y-auto"
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground/70">
              💡 Tip: Be specific about tone, expertise level, and response
              format
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none">
                Personality Files & Images
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <PaperclipIcon className="h-4 w-4 mr-2" />
                Attach
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              These files are sent as persistent context whenever this personality is active.
            </p>

            {form.assets.length > 0 ? (
              <div className="max-h-40 overflow-auto space-y-2 rounded-md border p-2">
                {form.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-md border px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {asset.type.startsWith("image/") ? (
                        <ImageIcon className="h-4 w-4 shrink-0" />
                      ) : (
                        <FileIcon className="h-4 w-4 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{asset.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(asset.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => removeAsset(asset.id)}
                      title="Remove"
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleAssetSelect}
            />
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid || isSaving}>
            {isSaving ? (
              <>
                <SparklesIcon className="h-4 w-4 animate-pulse" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
