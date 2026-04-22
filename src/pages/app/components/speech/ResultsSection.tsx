import { Markdown, CopyButton } from "@/components";
import { Loader2, SparklesIcon } from "lucide-react";

type Props = {
  lastAIResponse: string;
  isAIProcessing: boolean;
};

export const ResultsSection = ({
  lastAIResponse,
  isAIProcessing,
}: Props) => {
  const hasResponse = lastAIResponse || isAIProcessing;

  if (!hasResponse) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SparklesIcon className="w-3.5 h-3.5 text-primary" />
          <h4 className="text-xs font-medium">AI Response</h4>
        </div>
        {lastAIResponse && <CopyButton content={lastAIResponse} />}
      </div>

      <div>
        {isAIProcessing && !lastAIResponse ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">
              Listening and generating response...
            </span>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Markdown>{lastAIResponse}</Markdown>
            {isAIProcessing && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
