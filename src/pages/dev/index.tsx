import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Card,
  CardContent,
  Header,
  Input,
  Selection,
} from "@/components";
import { useApp } from "@/contexts";
import { PageLayout } from "@/layouts";

const OPENAI_PROVIDER_ID = "openai";
const CLAUDE_PROVIDER_ID = "claude";
const LOCAL_PROVIDER_ID = "local-transformers";
const OPENAI_STT_PROVIDER_ID = "openai-whisper";
const LOCAL_CACHE_DIRECTORY_STORAGE_KEY = "local_hf_cache_directory";
const OPENAI_STT_MODEL = "whisper-1";

type ReasoningProviderId =
  | typeof OPENAI_PROVIDER_ID
  | typeof CLAUDE_PROVIDER_ID
  | typeof LOCAL_PROVIDER_ID;

const REASONING_PROVIDER_OPTIONS: {
  label: string;
  value: ReasoningProviderId;
}[] = [
  { label: "OpenAI", value: OPENAI_PROVIDER_ID },
  { label: "Claude", value: CLAUDE_PROVIDER_ID },
  { label: "Local (Transformers / Hugging Face)", value: LOCAL_PROVIDER_ID },
];

const REASONING_MODELS_BY_PROVIDER: Record<ReasoningProviderId, string[]> = {
  [OPENAI_PROVIDER_ID]: [
    "gpt-5.4",
    "gpt-5.2",
    "gpt-5.1",
    "gpt-5",
    "gpt-5-mini",
    "gpt-5-nano",
  ],
  [CLAUDE_PROVIDER_ID]: [
    "claude-opus-4-6",
    "claude-sonnet-4-6",
    "claude-opus-4-5",
    "claude-sonnet-4-5",
  ],
  [LOCAL_PROVIDER_ID]: ["local-transformers-model"],
};

const DEFAULT_MODEL_BY_PROVIDER: Record<ReasoningProviderId, string> = {
  [OPENAI_PROVIDER_ID]: "gpt-5-mini",
  [CLAUDE_PROVIDER_ID]: "claude-sonnet-4-6",
  [LOCAL_PROVIDER_ID]: "local-transformers-model",
};

const DevSpace = () => {
  const {
    selectedAIProvider,
    selectedSttProvider,
    onSetSelectedAIProvider,
    onSetSelectedSttProvider,
  } = useApp();
  const localDirectoryInputRef = useRef<HTMLInputElement | null>(null);
  const initializedRef = useRef(false);

  const [reasoningProvider, setReasoningProvider] =
    useState<ReasoningProviderId>(OPENAI_PROVIDER_ID);
  const [reasoningApiKey, setReasoningApiKey] = useState("");
  const [whisperApiKey, setWhisperApiKey] = useState("");
  const [reasoningModel, setReasoningModel] = useState(
    DEFAULT_MODEL_BY_PROVIDER[OPENAI_PROVIDER_ID]
  );
  const [localCacheDirectory, setLocalCacheDirectory] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestStatus, setConnectionTestStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({
    type: "idle",
    message: "",
  });

  const selectedProviderLabel =
    reasoningProvider === OPENAI_PROVIDER_ID
      ? "OpenAI"
      : reasoningProvider === CLAUDE_PROVIDER_ID
      ? "Claude"
      : "Local";

  const applyConfiguration = (
    provider: ReasoningProviderId,
    model: string,
    providerApiKey: string,
    sttApiKey: string,
    cacheDir: string
  ) => {
    onSetSelectedAIProvider({
      provider,
      variables: {
        ...selectedAIProvider.variables,
        api_key: providerApiKey,
        model,
        hf_cache_dir: cacheDir,
      },
    });

    onSetSelectedSttProvider({
      provider: OPENAI_STT_PROVIDER_ID,
      variables: {
        ...selectedSttProvider.variables,
        api_key: sttApiKey,
        model: OPENAI_STT_MODEL,
      },
    });
  };

  const availableReasoningModels = useMemo(
    () => REASONING_MODELS_BY_PROVIDER[reasoningProvider],
    [reasoningProvider]
  );

  useEffect(() => {
    const resolvedProvider =
      selectedAIProvider.provider === OPENAI_PROVIDER_ID ||
      selectedAIProvider.provider === CLAUDE_PROVIDER_ID ||
      selectedAIProvider.provider === LOCAL_PROVIDER_ID
        ? (selectedAIProvider.provider as ReasoningProviderId)
        : OPENAI_PROVIDER_ID;

    const providerModels = REASONING_MODELS_BY_PROVIDER[resolvedProvider];
    const resolvedModel = providerModels.includes(
      selectedAIProvider.variables?.model || ""
    )
      ? (selectedAIProvider.variables?.model as string)
      : DEFAULT_MODEL_BY_PROVIDER[resolvedProvider];

    const resolvedReasoningKey = selectedAIProvider.variables?.api_key || "";
    const resolvedWhisperKey =
      selectedSttProvider.variables?.api_key || resolvedReasoningKey;
    const resolvedCacheDir =
      localStorage.getItem(LOCAL_CACHE_DIRECTORY_STORAGE_KEY) ||
      selectedAIProvider.variables?.hf_cache_dir ||
      "";

    setReasoningProvider(resolvedProvider);
    setReasoningModel(resolvedModel);
    setReasoningApiKey(resolvedReasoningKey);
    setWhisperApiKey(resolvedWhisperKey);
    setLocalCacheDirectory(resolvedCacheDir);

    if (!localStorage.getItem(LOCAL_CACHE_DIRECTORY_STORAGE_KEY) && resolvedCacheDir) {
      localStorage.setItem(LOCAL_CACHE_DIRECTORY_STORAGE_KEY, resolvedCacheDir);
    }

    applyConfiguration(
      resolvedProvider,
      resolvedModel,
      resolvedReasoningKey,
      resolvedWhisperKey,
      resolvedCacheDir
    );

    initializedRef.current = true;
  }, []);

  const handleReasoningApiKeyChange = (
    value: string | ChangeEvent<HTMLInputElement>
  ) => {
    const nextValue = typeof value === "string" ? value : value.target.value;
    setReasoningApiKey(nextValue);
    const nextWhisperKey =
      reasoningProvider === OPENAI_PROVIDER_ID && !whisperApiKey
        ? nextValue
        : whisperApiKey;
    if (reasoningProvider === OPENAI_PROVIDER_ID && !whisperApiKey) {
      setWhisperApiKey(nextValue);
    }
    applyConfiguration(
      reasoningProvider,
      reasoningModel,
      nextValue,
      nextWhisperKey,
      localCacheDirectory
    );
  };

  const handleWhisperApiKeyChange = (
    value: string | ChangeEvent<HTMLInputElement>
  ) => {
    const nextValue = typeof value === "string" ? value : value.target.value;
    setWhisperApiKey(nextValue);
    applyConfiguration(
      reasoningProvider,
      reasoningModel,
      reasoningApiKey,
      nextValue,
      localCacheDirectory
    );
  };

  const handleReasoningProviderChange = (value: string) => {
    const nextProvider = value as ReasoningProviderId;
    const currentModels = REASONING_MODELS_BY_PROVIDER[nextProvider];
    const nextModel = currentModels.includes(reasoningModel)
      ? reasoningModel
      : DEFAULT_MODEL_BY_PROVIDER[nextProvider];
    const nextWhisperKey =
      nextProvider === OPENAI_PROVIDER_ID && !whisperApiKey
        ? reasoningApiKey
        : whisperApiKey;

    setReasoningProvider(nextProvider);
    setReasoningModel(nextModel);
    if (nextProvider === OPENAI_PROVIDER_ID && !whisperApiKey) {
      setWhisperApiKey(reasoningApiKey);
    }

    applyConfiguration(
      nextProvider,
      nextModel,
      reasoningApiKey,
      nextWhisperKey,
      localCacheDirectory
    );
  };

  const handleReasoningModelChange = (value: string) => {
    setReasoningModel(value);
    applyConfiguration(
      reasoningProvider,
      value,
      reasoningApiKey,
      whisperApiKey,
      localCacheDirectory
    );
  };

  const handleCacheDirectoryBrowse = () => {
    localDirectoryInputRef.current?.click();
  };

  const handleCacheDirectoryPicked = (e: ChangeEvent<HTMLInputElement>) => {
    const firstFile = e.target.files?.[0] as
      | (File & { path?: string; webkitRelativePath?: string })
      | undefined;
    if (!firstFile) return;

    let directoryPath = "";

    if (typeof firstFile.path === "string" && firstFile.path.length > 0) {
      const normalized = firstFile.path.replace(/\\/g, "/");
      directoryPath = normalized.substring(0, normalized.lastIndexOf("/"));
    } else if (firstFile.webkitRelativePath) {
      const root = firstFile.webkitRelativePath.split("/")[0];
      directoryPath = root;
    }

    if (directoryPath) {
      setLocalCacheDirectory(directoryPath);
      localStorage.setItem(LOCAL_CACHE_DIRECTORY_STORAGE_KEY, directoryPath);
      applyConfiguration(
        reasoningProvider,
        reasoningModel,
        reasoningApiKey,
        whisperApiKey,
        directoryPath
      );
    }
  };

  const runConnectionTest = async () => {
    if (isTestingConnection) {
      return;
    }

    if (
      reasoningProvider !== LOCAL_PROVIDER_ID &&
      !reasoningApiKey.trim()
    ) {
      setConnectionTestStatus({
        type: "error",
        message: `Please add a ${selectedProviderLabel} API key before testing.`,
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestStatus({
      type: "idle",
      message: "Running connection test...",
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      let response: Response;

      if (reasoningProvider === OPENAI_PROVIDER_ID) {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${reasoningApiKey.trim()}`,
          },
          body: JSON.stringify({
            model: reasoningModel,
            messages: [{ role: "user", content: "Ping" }],
            max_completion_tokens: 5,
          }),
          signal: controller.signal,
        });
      } else if (reasoningProvider === CLAUDE_PROVIDER_ID) {
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": reasoningApiKey.trim(),
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: reasoningModel,
            max_tokens: 16,
            messages: [
              {
                role: "user",
                content: [{ type: "text", text: "Ping" }],
              },
            ],
          }),
          signal: controller.signal,
        });
      } else {
        response = await fetch("http://127.0.0.1:8000/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(reasoningApiKey.trim()
              ? { Authorization: `Bearer ${reasoningApiKey.trim()}` }
              : {}),
          },
          body: JSON.stringify({
            model: reasoningModel,
            messages: [{ role: "user", content: "Ping" }],
            max_tokens: 5,
          }),
          signal: controller.signal,
        });
      }

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          body?.error?.message ||
          body?.error ||
          body?.message ||
          `${response.status} ${response.statusText}`;
        throw new Error(String(errorMessage));
      }

      setConnectionTestStatus({
        type: "success",
        message: `Connection successful for ${selectedProviderLabel} (${reasoningModel}).`,
      });
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "Connection test timed out after 15s."
          : error instanceof Error
          ? error.message
          : "Unknown connection error";
      setConnectionTestStatus({
        type: "error",
        message: `Connection failed: ${message}`,
      });
    } finally {
      clearTimeout(timeout);
      setIsTestingConnection(false);
    }
  };

  return (
    <PageLayout
      title="Dev Space"
      description="Configure reasoning providers (OpenAI, Claude, local Transformers/Hugging Face) and Whisper STT." 
    >
      <div className="space-y-4">
        <Header
          title="Reasoning Provider"
          description="Choose your reasoning provider and model."
          isMainTitle
        />

        <Selection
          selected={reasoningProvider}
          onChange={handleReasoningProviderChange}
          options={REASONING_PROVIDER_OPTIONS}
          placeholder="Select reasoning provider"
        />

        <div className="space-y-2">
          <Header
            title={`${
              reasoningProvider === OPENAI_PROVIDER_ID
                ? "OpenAI"
                : reasoningProvider === CLAUDE_PROVIDER_ID
                ? "Claude"
                : "Local"
            } API Key`}
            description={
              reasoningProvider === LOCAL_PROVIDER_ID
                ? "Optional for local OpenAI-compatible servers."
                : "Used to authenticate your selected reasoning provider."
            }
          />
          <Input
            type="password"
            placeholder={
              reasoningProvider === CLAUDE_PROVIDER_ID
                ? "sk-ant-..."
                : reasoningProvider === OPENAI_PROVIDER_ID
                ? "sk-..."
                : "Optional"
            }
            value={reasoningApiKey}
            onChange={handleReasoningApiKeyChange}
            className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Header
            title="Whisper (STT) OpenAI API Key"
            description="Used for speech transcription with whisper-1."
          />
          <Input
            type="password"
            placeholder="sk-..."
            value={whisperApiKey}
            onChange={handleWhisperApiKeyChange}
            className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Header
            title="Reasoning Model"
            description="Choose the reasoning model for your selected provider."
          />
          <Selection
            selected={reasoningModel}
            onChange={handleReasoningModelChange}
            options={availableReasoningModels.map((model) => ({
              label: model,
              value: model,
            }))}
            placeholder="Select reasoning model"
          />
        </div>

        {reasoningProvider === LOCAL_PROVIDER_ID && (
          <div className="space-y-2">
            <Header
              title="Hugging Face / Transformers Cache Directory"
              description="Browse to your .cache directory containing model blobs and weights."
            />
            <div className="flex gap-2">
              <Input
                value={localCacheDirectory}
                onChange={(e) => {
                  setLocalCacheDirectory(e.target.value);
                  localStorage.setItem(
                    LOCAL_CACHE_DIRECTORY_STORAGE_KEY,
                    e.target.value
                  );
                  if (initializedRef.current) {
                    applyConfiguration(
                      reasoningProvider,
                      reasoningModel,
                      reasoningApiKey,
                      whisperApiKey,
                      e.target.value
                    );
                  }
                }}
                placeholder="~/.cache/huggingface/hub"
                className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
              />
              <button
                type="button"
                onClick={handleCacheDirectoryBrowse}
                className="h-11 px-4 rounded-xl border border-input/50 text-sm font-medium"
              >
                Browse
              </button>
            </div>
            <input
              ref={localDirectoryInputRef}
              type="file"
              className="hidden"
              // @ts-expect-error webkitdirectory is Chromium/WebView specific
              webkitdirectory=""
              directory=""
              onChange={handleCacheDirectoryPicked}
            />
            <p className="text-xs text-muted-foreground">
              Tip: run a local OpenAI-compatible Transformers server that reads
              from this cache directory (for example, using Hugging Face model
              weights).
            </p>
          </div>
        )}

        <Card className="shadow-none border border-border/70 rounded-xl">
          <CardContent className="p-4 space-y-1">
            <p className="text-sm font-medium">Configured models</p>
            <p className="text-xs text-muted-foreground">
              Reasoning provider: {reasoningProvider}
            </p>
            <p className="text-xs text-muted-foreground">
              Reasoning model: {reasoningModel}
            </p>
            <p className="text-xs text-muted-foreground">
              STT model: {OPENAI_STT_MODEL}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border/70 rounded-xl">
          <CardContent className="p-4 space-y-3">
            <Header
              title={`Test ${selectedProviderLabel} Connection`}
              description="Runs a lightweight request with the current model and API key to verify provider connectivity."
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={runConnectionTest}
                disabled={isTestingConnection}
                className="h-10"
              >
                {isTestingConnection ? "Testing..." : "Test Connection"}
              </Button>
              {connectionTestStatus.message && (
                <p
                  className={`text-xs ${
                    connectionTestStatus.type === "success"
                      ? "text-emerald-600"
                      : connectionTestStatus.type === "error"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {connectionTestStatus.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default DevSpace;
