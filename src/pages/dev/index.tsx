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
const DEV_MODELS_BY_PROVIDER_STORAGE_KEY = "dev_reasoning_models_by_provider";

const DEFAULT_REASONING_MODELS_BY_PROVIDER: Record<ReasoningProviderId, string[]> = {
  [OPENAI_PROVIDER_ID]: [
    "gpt-5.4-2026-03-05",
    "gpt-5.4-mini-2026-03-17",
    "gpt-5.4-nano-2026-03-17",
  ],
  [CLAUDE_PROVIDER_ID]: [
    "gpt-5.4-2026-03-05",
    "gpt-5.4-mini-2026-03-17",
    "gpt-5.4-nano-2026-03-17",
  ],
  [LOCAL_PROVIDER_ID]: [
    "gpt-5.4-2026-03-05",
    "gpt-5.4-mini-2026-03-17",
    "gpt-5.4-nano-2026-03-17",
  ],
};

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

const DEFAULT_MODEL_BY_PROVIDER: Record<ReasoningProviderId, string> = {
  [OPENAI_PROVIDER_ID]: "gpt-5.4-mini-2026-03-17",
  [CLAUDE_PROVIDER_ID]: "gpt-5.4-mini-2026-03-17",
  [LOCAL_PROVIDER_ID]: "gpt-5.4-mini-2026-03-17",
};

const getReasoningModelsByProvider = (): Record<ReasoningProviderId, string[]> => {
  try {
    const raw = localStorage.getItem(DEV_MODELS_BY_PROVIDER_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_REASONING_MODELS_BY_PROVIDER;
    }

    const parsed = JSON.parse(raw) as Partial<Record<ReasoningProviderId, string[]>>;
    return {
      [OPENAI_PROVIDER_ID]:
        parsed[OPENAI_PROVIDER_ID]?.filter(Boolean) ||
        DEFAULT_REASONING_MODELS_BY_PROVIDER[OPENAI_PROVIDER_ID],
      [CLAUDE_PROVIDER_ID]:
        parsed[CLAUDE_PROVIDER_ID]?.filter(Boolean) ||
        DEFAULT_REASONING_MODELS_BY_PROVIDER[CLAUDE_PROVIDER_ID],
      [LOCAL_PROVIDER_ID]:
        parsed[LOCAL_PROVIDER_ID]?.filter(Boolean) ||
        DEFAULT_REASONING_MODELS_BY_PROVIDER[LOCAL_PROVIDER_ID],
    };
  } catch {
    return DEFAULT_REASONING_MODELS_BY_PROVIDER;
  }
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
  const [reasoningModelsByProvider, setReasoningModelsByProvider] = useState<
    Record<ReasoningProviderId, string[]>
  >(() => getReasoningModelsByProvider());
  const [modelEditorVisible, setModelEditorVisible] = useState(false);
  const [modelEditorValue, setModelEditorValue] = useState("");
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
    () =>
      reasoningModelsByProvider[reasoningProvider]?.length > 0
        ? reasoningModelsByProvider[reasoningProvider]
        : DEFAULT_REASONING_MODELS_BY_PROVIDER[reasoningProvider],
    [reasoningModelsByProvider, reasoningProvider]
  );

  useEffect(() => {
    const handleHiddenToggle = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.altKey && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setModelEditorVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleHiddenToggle);
    return () => window.removeEventListener("keydown", handleHiddenToggle);
  }, []);

  useEffect(() => {
    setModelEditorValue(availableReasoningModels.join("\n"));
  }, [availableReasoningModels]);

  useEffect(() => {
    const resolvedProvider =
      selectedAIProvider.provider === OPENAI_PROVIDER_ID ||
      selectedAIProvider.provider === CLAUDE_PROVIDER_ID ||
      selectedAIProvider.provider === LOCAL_PROVIDER_ID
        ? (selectedAIProvider.provider as ReasoningProviderId)
        : OPENAI_PROVIDER_ID;

    const providerModels =
      reasoningModelsByProvider[resolvedProvider] ||
      DEFAULT_REASONING_MODELS_BY_PROVIDER[resolvedProvider];
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
  }, [reasoningModelsByProvider]);

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
    const currentModels =
      reasoningModelsByProvider[nextProvider] ||
      DEFAULT_REASONING_MODELS_BY_PROVIDER[nextProvider];
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

  const saveDevModels = () => {
    const parsed = modelEditorValue
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const nextModels = parsed.length
      ? parsed
      : DEFAULT_REASONING_MODELS_BY_PROVIDER[reasoningProvider];

    const next = {
      ...reasoningModelsByProvider,
      [reasoningProvider]: nextModels,
    };

    setReasoningModelsByProvider(next);
    localStorage.setItem(DEV_MODELS_BY_PROVIDER_STORAGE_KEY, JSON.stringify(next));

    if (!nextModels.includes(reasoningModel)) {
      const nextModel = nextModels[0];
      setReasoningModel(nextModel);
      applyConfiguration(
        reasoningProvider,
        nextModel,
        reasoningApiKey,
        whisperApiKey,
        localCacheDirectory
      );
    }
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
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <section className="rounded-xl border border-border/60 bg-background">
            <div className="border-b border-border/60 px-5 py-4">
              <Header
                title="Reasoning"
                description="Choose the provider, model, and credentials used for chat responses."
                isMainTitle
              />
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="space-y-2">
                <Header
                  title="Reasoning Provider"
                  description="Choose your reasoning provider and model."
                />
                <Selection
                  selected={reasoningProvider}
                  onChange={handleReasoningProviderChange}
                  options={REASONING_PROVIDER_OPTIONS}
                  placeholder="Select reasoning provider"
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
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
                      className="h-11 rounded-md border border-input/50 px-4 text-sm font-medium"
                    >
                      Browse
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Run a local OpenAI-compatible Transformers server that reads from this cache directory.
                  </p>
                  <input
                    ref={localDirectoryInputRef}
                    type="file"
                    className="hidden"
                    {...({ webkitdirectory: "", directory: "" } as any)}
                    onChange={handleCacheDirectoryPicked}
                  />
                </div>
              )}

              {modelEditorVisible ? (
                <div className="space-y-2 rounded-lg border border-dashed border-border/70 p-4">
                  <Header
                    title="Hidden Model Editor"
                    description="Dev-only model override. One model ID per line."
                  />
                  <textarea
                    value={modelEditorValue}
                    onChange={(e) => setModelEditorValue(e.target.value)}
                    className="w-full min-h-28 rounded-md border border-input/50 bg-background px-3 py-2 text-sm"
                    placeholder="gpt-5.4-2026-03-05\ngpt-5.4-mini-2026-03-17\ngpt-5.4-nano-2026-03-17"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setModelEditorValue(availableReasoningModels.join("\n"))
                      }
                    >
                      Reset
                    </Button>
                    <Button onClick={saveDevModels}>Save Models</Button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-xl border border-border/60 bg-background">
              <div className="border-b border-border/60 px-5 py-4">
                <Header
                  title="Speech to Text"
                  description="Configure the Whisper key used for transcription."
                />
              </div>
              <div className="px-5 py-5">
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
              </div>
            </section>

            <Card className="rounded-xl border border-border/60 shadow-none">
              <CardContent className="space-y-2 p-5">
                <p className="text-sm font-medium">Current configuration</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Reasoning provider: {reasoningProvider}</p>
                  <p>Reasoning model: {reasoningModel}</p>
                  <p>STT model: {OPENAI_STT_MODEL}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border/60 shadow-none">
              <CardContent className="space-y-4 p-5">
                <Header
                  title={`Test ${selectedProviderLabel} Connection`}
                  description="Runs a lightweight request with the current model and API key to verify provider connectivity."
                />
                <div className="space-y-3">
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
        </div>
      </div>
    </PageLayout>
  );
};

export default DevSpace;
