import { AlertCircleIcon, LoaderIcon, MicIcon } from "lucide-react";

type Props = {
  setupRequired: boolean;
  error: string;
  isProcessing: boolean;
  isAIProcessing: boolean;
  capturing: boolean;
  isSpeechActive?: boolean;
  isMicActive?: boolean;
};

export const StatusIndicator = ({
  setupRequired,
  error,
  isProcessing,
  isAIProcessing,
  capturing,
  isSpeechActive,
  isMicActive,
}: Props) => {
  // Don't show anything if not capturing and no error
  if (!capturing && !error && !isProcessing && !isAIProcessing) {
    return null;
  }

  return (
    <div className="flex flex-1 items-center gap-2 px-3 py-2 justify-end">
      {/* Mic active indicator - always visible when mic is recording */}
      {capturing && isMicActive ? (
        <div className="flex items-center gap-1 text-rose-500" title="Mic recording">
          <MicIcon className="w-3.5 h-3.5" />
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        </div>
      ) : null}

      {/* Separator when both mic and status are shown */}
      {capturing && isMicActive && !error ? (
        <div className="w-px h-3.5 bg-zinc-300 dark:bg-zinc-600" />
      ) : null}

      {/* Priority: Error > AI Processing > Transcribing > Listening */}
      {error && !setupRequired ? (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircleIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{error}</span>
        </div>
      ) : isAIProcessing ? (
        <div className="flex items-center gap-2 animate-pulse">
          <LoaderIcon className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">Generating response...</span>
        </div>
      ) : isProcessing ? (
        <div className="flex items-center gap-2 animate-pulse">
          <LoaderIcon className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">Transcribing...</span>
        </div>
      ) : capturing && isSpeechActive ? (
        <div className="flex items-center gap-2 text-amber-500 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-medium">Hearing speech...</span>
        </div>
      ) : capturing ? (
        <div className="flex items-center gap-2 text-green-600 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium">Listening...</span>
        </div>
      ) : null}
    </div>
  );
};
