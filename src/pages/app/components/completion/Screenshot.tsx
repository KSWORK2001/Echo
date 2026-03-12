import { Button } from "@/components";
import {
  LaptopMinimalIcon,
  Loader2,
  MousePointer2Icon,
  SendIcon,
} from "lucide-react";
import { UseCompletionReturn } from "@/types";
import { MAX_FILES } from "@/config";
import { useApp } from "@/contexts";

export const Screenshot = ({
  screenshotConfiguration,
  attachedFiles,
  isLoading,
  submit,
  captureScreenshot,
  isScreenshotLoading,
}: UseCompletionReturn) => {
  const { supportsImages } = useApp();
  const captureMode = screenshotConfiguration.enabled
    ? "Screenshot"
    : "Selection";

  const isDisabled =
    attachedFiles.length >= MAX_FILES ||
    isLoading ||
    isScreenshotLoading ||
    !supportsImages;
  const canSend =
    attachedFiles.length > 0 &&
    !isLoading &&
    !isScreenshotLoading &&
    supportsImages;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        className="cursor-pointer"
        title={
          !supportsImages
            ? "Screenshot not supported by current AI provider"
            : `${captureMode} mode - ${attachedFiles.length}/${MAX_FILES} files`
        }
        onClick={captureScreenshot}
        disabled={isDisabled}
      >
        {isScreenshotLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : screenshotConfiguration.enabled ? (
          <LaptopMinimalIcon className="h-4 w-4" />
        ) : (
          <MousePointer2Icon className="h-4 w-4" />
        )}
      </Button>
      <Button
        size="icon"
        variant="outline"
        className="cursor-pointer !bg-white dark:!bg-white !text-black dark:!text-black hover:!bg-white/90 dark:hover:!bg-white/90"
        title="Send attached screenshots"
        onClick={() => submit()}
        disabled={!canSend}
      >
        <SendIcon className="h-4 w-4 !text-black dark:!text-black" />
      </Button>
    </div>
  );
};
