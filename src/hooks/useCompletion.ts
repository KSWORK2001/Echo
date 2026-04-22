import { useState, useCallback, useRef, useEffect } from "react";
import { useWindowResize } from "./useWindow";
import { useGlobalShortcuts } from "@/hooks";
import { MAX_FILES } from "@/config";
import { useApp } from "@/contexts";
import {
  fetchAIResponse,
  sanitizeSpokenScript,
  saveConversation,
  getConversationById,
  generateConversationTitle,
  MESSAGE_ID_OFFSET,
  generateConversationId,
  generateMessageId,
  generateRequestId,
  getResponseSettings,
} from "@/lib";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// Types for completion
interface AttachedFile {
  id: string;
  name: string;
  type: string;
  base64: string;
  size: number;
}

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(["pdf", "txt", "doc", "docx"]);
const MAX_TEXT_ATTACHMENT_CHARS = 12_000;
const MAX_TOTAL_ATTACHMENT_CONTEXT_CHARS = 24_000;
const MAX_BINARY_SAMPLE_CHARS = 1_200;
const PDF_METADATA_REGEX =
  /^(obj|endobj|xref|trailer|stream|endstream|catalog|pages|font|procset|length|filter)$/i;
const LATEST_TURN_FOCUS_INSTRUCTION =
  "Use earlier conversation only as context. Answer only the latest user request below. Do not answer earlier pending questions unless the latest request explicitly asks for it.";
const ATTACHMENT_ONLY_PROMPT = `Analyze the attached screenshot/files and infer what the user most likely needs.

Return a clean, well-spaced answer in this format:
1) "Answer" (direct result first)
2) "Why" (brief reasoning)
3) "Next step" (only if useful)

If the content is a coding/math/financial problem, include a short thought process and provide the final solution in a fenced code block when code or structured calculations help clarity.

If it is not a coding problem, do not force a code block—just provide the best analysis/solution for what is on screen.

If the screenshot is ambiguous, state assumptions briefly and proceed with the most likely interpretation.`;

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

const decodeBase64Text = (base64: string): string => {
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
};

const decodePdfLiteralString = (literal: string): string => {
  let result = "";

  for (let i = 0; i < literal.length; i += 1) {
    const char = literal[i];

    if (char !== "\\") {
      result += char;
      continue;
    }

    const next = literal[i + 1];
    if (!next) {
      break;
    }

    if (/[0-7]/.test(next)) {
      const octal = literal.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] || "";
      if (octal) {
        result += String.fromCharCode(parseInt(octal, 8));
        i += octal.length;
        continue;
      }
    }

    const escapeMap: Record<string, string> = {
      n: "\n",
      r: "\r",
      t: "\t",
      b: "\b",
      f: "\f",
      "(": "(",
      ")": ")",
      "\\": "\\",
    };

    result += escapeMap[next] ?? next;
    i += 1;
  }

  return result;
};

const normalizeExtractedText = (value: string): string =>
  value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractReadableFragmentsFromBinary = (
  base64: string,
  maxChars: number
): string => {
  try {
    const source = atob(base64);
    const matches = source.match(/[A-Za-z0-9][A-Za-z0-9\s.,;:()\[\]{}'"/\\@&+_-]{25,}/g) || [];

    const fragments: string[] = [];
    const seen = new Set<string>();
    let usedChars = 0;

    for (const match of matches) {
      const cleaned = normalizeExtractedText(match);
      if (!cleaned) {
        continue;
      }

      const lowered = cleaned.toLowerCase();
      if (seen.has(lowered) || PDF_METADATA_REGEX.test(lowered)) {
        continue;
      }

      seen.add(lowered);
      const clipped = cleaned.slice(0, Math.max(0, maxChars - usedChars));
      if (!clipped) {
        break;
      }

      fragments.push(clipped);
      usedChars += clipped.length;
      if (usedChars >= maxChars) {
        break;
      }
    }

    return fragments.join(" ");
  } catch {
    return "";
  }
};

const extractPdfTextFromBase64 = (base64: string, maxChars: number): string => {
  try {
    const source = atob(base64);
    const fragments: string[] = [];
    const seen = new Set<string>();
    let usedChars = 0;

    for (const match of source.matchAll(/\((?:\\.|[^()\\]){4,}\)/g)) {
      if (usedChars >= maxChars) {
        break;
      }

      const decoded = normalizeExtractedText(
        decodePdfLiteralString(match[0].slice(1, -1))
      );
      if (!decoded) {
        continue;
      }

      const lowered = decoded.toLowerCase();
      if (seen.has(lowered) || PDF_METADATA_REGEX.test(lowered)) {
        continue;
      }

      seen.add(lowered);
      const clipped = decoded.slice(0, Math.max(0, maxChars - usedChars));
      if (!clipped) {
        break;
      }

      fragments.push(clipped);
      usedChars += clipped.length;
    }

    const extracted = fragments.join(" ").trim();
    if (extracted) {
      return extracted;
    }

    return extractReadableFragmentsFromBinary(base64, maxChars);
  } catch {
    return "";
  }
};

const extractDocumentText = (file: AttachedFile, maxChars: number): string => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  if (fileType === "text/plain" || fileName.endsWith(".txt")) {
    return decodeBase64Text(file.base64).trim().slice(0, maxChars);
  }

  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    return extractPdfTextFromBase64(file.base64, maxChars);
  }

  return extractReadableFragmentsFromBinary(file.base64, maxChars);
};

const buildBinarySample = (base64: string): string => {
  if (!base64) {
    return "";
  }

  if (base64.length <= MAX_BINARY_SAMPLE_CHARS) {
    return base64;
  }

  const half = Math.floor(MAX_BINARY_SAMPLE_CHARS / 2);
  return `${base64.slice(0, half)}...${base64.slice(-half)}`;
};

const buildAttachmentContext = (attachedFiles: AttachedFile[]): string => {
  const nonImageFiles = attachedFiles.filter((file) => !file.type.startsWith("image/"));
  if (nonImageFiles.length === 0) {
    return "";
  }

  const lines: string[] = [
    "Attached reference files (use these details when relevant to personalize the answer):",
  ];
  let remainingChars = MAX_TOTAL_ATTACHMENT_CONTEXT_CHARS;

  nonImageFiles.forEach((file) => {
    if (remainingChars <= 0) {
      return;
    }

    const extracted = extractDocumentText(
      file,
      Math.min(MAX_TEXT_ATTACHMENT_CHARS, remainingChars)
    );

    if (extracted) {
      const clipped = extracted.slice(0, Math.min(MAX_TEXT_ATTACHMENT_CHARS, remainingChars));
      remainingChars -= clipped.length;

      lines.push(`- ${file.name} (${file.type || "unknown"}):`);
      lines.push(clipped);
    } else {
      const sample = buildBinarySample(file.base64);
      lines.push(
        `- ${file.name} (${file.type || "unknown"}) attached for reference. Could not extract readable local text; including bounded raw payload sample for model context.`
      );
      if (sample) {
        lines.push(`RAW_BASE64_SAMPLE: ${sample}`);
      }
    }
  });

  return `\n\n${lines.join("\n")}`;
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface CompletionState {
  input: string;
  response: string;
  isLoading: boolean;
  error: string | null;
  attachedFiles: AttachedFile[];
  currentConversationId: string | null;
  conversationHistory: ChatMessage[];
}

export const useCompletion = () => {
  const {
    selectedAIProvider,
    allAiProviders,
    systemPrompt,
    screenshotConfiguration,
    setScreenshotConfiguration,
  } = useApp();
  const globalShortcuts = useGlobalShortcuts();

  const [state, setState] = useState<CompletionState>({
    input: "",
    response: "",
    isLoading: false,
    error: null,
    attachedFiles: [],
    currentConversationId: null,
    conversationHistory: [],
  });
  const [micOpen, setMicOpen] = useState(false);
  const [enableVAD, setEnableVAD] = useState(false);
  const [messageHistoryOpen, setMessageHistoryOpen] = useState(false);
  const [isFilesPopoverOpen, setIsFilesPopoverOpen] = useState(false);
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);
  const [keepEngaged, setKeepEngaged] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isProcessingScreenshotRef = useRef(false);
  const screenshotConfigRef = useRef(screenshotConfiguration);
  const hasCheckedPermissionRef = useRef(false);
  const screenshotInitiatedByThisContext = useRef(false);

  const { resizeWindow } = useWindowResize();

  useEffect(() => {
    screenshotConfigRef.current = screenshotConfiguration;
  }, [screenshotConfiguration]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);

  const setInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const setResponse = useCallback((value: string) => {
    setState((prev) => ({ ...prev, response: value }));
  }, []);

  const addFile = useCallback(async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const attachedFile: AttachedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        base64,
        size: file.size,
      };

      setState((prev) => ({
        ...prev,
        attachedFiles: [...prev.attachedFiles, attachedFile],
      }));
    } catch (error) {
      console.error("Failed to process file:", error);
    }
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      attachedFiles: prev.attachedFiles.filter((f) => f.id !== fileId),
    }));
  }, []);

  const clearFiles = useCallback(() => {
    setState((prev) => ({ ...prev, attachedFiles: [] }));
  }, []);

  const submit = useCallback(
    async (speechText?: string, attachedFilesOverride?: AttachedFile[]) => {
      const typedInput = speechText || state.input;
      const attachedFiles = attachedFilesOverride ?? state.attachedFiles;
      const hasAttachments = attachedFiles.length > 0;
      const input =
        typedInput.trim() || (hasAttachments ? ATTACHMENT_ONLY_PROMPT : "");
      const attachmentContext = buildAttachmentContext(attachedFiles);
      const aiUserMessage = `${LATEST_TURN_FOCUS_INSTRUCTION}\n\nLatest user request:\n${input}${attachmentContext}`;

      if (!input.trim()) {
        return;
      }

      // Close message history when submitting so response panel shows
      setMessageHistoryOpen(false);

      if (speechText) {
        setState((prev) => ({
          ...prev,
          input: speechText,
        }));
      }

      // Generate unique request ID
      const requestId = generateRequestId();
      currentRequestIdRef.current = requestId;

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        // Prepare message history for the AI
        const messageHistory = state.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Handle image attachments
        const imagesBase64: string[] = [];
        if (attachedFiles.length > 0) {
          attachedFiles.forEach((file) => {
            if (file.type.startsWith("image/")) {
              imagesBase64.push(file.base64);
            }
          });
        }

        let fullResponse = "";

        // Check if AI provider is configured
        if (!selectedAIProvider.provider) {
          setState((prev) => ({
            ...prev,
            error: "Please select an AI provider in settings",
          }));
          return;
        }

        const provider = allAiProviders.find(
          (p) => p.id === selectedAIProvider.provider
        );
        if (!provider) {
          setState((prev) => ({
            ...prev,
            error: "Invalid provider selected",
          }));
          return;
        }

        // Clear previous response and set loading state
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          response: "",
        }));

        try {
          // Use the fetchAIResponse function with signal
          for await (const chunk of fetchAIResponse({
            provider,
            selectedProvider: selectedAIProvider,
            systemPrompt: systemPrompt || undefined,
            history: messageHistory,
            userMessage: aiUserMessage,
            imagesBase64,
            signal,
          })) {
            // Only update if this is still the current request
            if (currentRequestIdRef.current !== requestId) {
              return; // Request was superseded, stop processing
            }

            // Check if request was aborted
            if (signal.aborted) {
              return; // Request was cancelled, stop processing
            }

            fullResponse += chunk;
            setState((prev) => ({
              ...prev,
              response: prev.response + chunk,
            }));
          }
        } catch (e: any) {
          // Only show error if this is still the current request and not aborted
          if (currentRequestIdRef.current === requestId && !signal.aborted) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: e.message || "An error occurred",
            }));
          }
          return;
        }

        // Only proceed if this is still the current request
        if (currentRequestIdRef.current !== requestId || signal.aborted) {
          return;
        }

        const cleanedResponse = sanitizeSpokenScript(fullResponse);
        if (cleanedResponse !== fullResponse) {
          setState((prev) => ({
            ...prev,
            response: cleanedResponse,
          }));
        }

        setState((prev) => ({ ...prev, isLoading: false }));

        // Focus input after AI response is complete
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);

        // Save the conversation after successful completion
        if (cleanedResponse.trim()) {
          await saveCurrentConversation(
            input,
            cleanedResponse,
            attachedFiles
          );
          // Clear input and attached files after saving
          setState((prev) => ({
            ...prev,
            input: "",
            attachedFiles: [],
          }));
        } else {
          setState((prev) => ({
            ...prev,
            error: "No response received from the model. Please try again.",
          }));
        }
      } catch (error) {
        // Only show error if not aborted
        if (!signal?.aborted && currentRequestIdRef.current === requestId) {
          setState((prev) => ({
            ...prev,
            error: error instanceof Error ? error.message : "An error occurred",
            isLoading: false,
          }));
        }
      }
    },
    [
      state.input,
      state.attachedFiles,
      selectedAIProvider,
      allAiProviders,
      systemPrompt,
      state.conversationHistory,
    ]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    currentRequestIdRef.current = null;
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    // Don't reset if keep engaged mode is active
    if (keepEngaged) {
      return;
    }
    cancel();
    setState((prev) => ({
      ...prev,
      input: "",
      response: "",
      error: null,
      attachedFiles: [],
    }));
  }, [cancel, keepEngaged]);

  // Helper function to convert file to base64
  const fileToBase64 = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string)?.split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }, []);

  // Note: saveConversation, getConversationById, and generateConversationTitle
  // are now imported from lib/database/chat-history.action.ts

  const loadConversation = useCallback((conversation: ChatConversation) => {
    setState((prev) => ({
      ...prev,
      currentConversationId: conversation.id,
      conversationHistory: conversation.messages,
      input: "",
      response: "",
      error: null,
      isLoading: false,
    }));
  }, []);

  const startNewConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentConversationId: null,
      conversationHistory: [],
      input: "",
      response: "",
      error: null,
      isLoading: false,
      attachedFiles: [],
    }));
  }, []);

  const saveCurrentConversation = useCallback(
    async (
      userMessage: string,
      assistantResponse: string,
      _attachedFiles: AttachedFile[]
    ) => {
      // Validate inputs
      if (!userMessage || !assistantResponse) {
        console.error("Cannot save conversation: missing message content");
        return;
      }

      const conversationId =
        state.currentConversationId || generateConversationId("chat");
      const timestamp = Date.now();

      const userMsg: ChatMessage = {
        id: generateMessageId("user", timestamp),
        role: "user",
        content: userMessage,
        timestamp,
      };

      const assistantMsg: ChatMessage = {
        id: generateMessageId("assistant", timestamp + MESSAGE_ID_OFFSET),
        role: "assistant",
        content: assistantResponse,
        timestamp: timestamp + MESSAGE_ID_OFFSET,
      };

      const newMessages = [...state.conversationHistory, userMsg, assistantMsg];

      // Get existing conversation if updating
      let existingConversation = null;
      if (state.currentConversationId) {
        try {
          existingConversation = await getConversationById(
            state.currentConversationId
          );
        } catch (error) {
          console.error("Failed to get existing conversation:", error);
        }
      }

      const title =
        state.conversationHistory.length === 0
          ? generateConversationTitle(userMessage)
          : existingConversation?.title ||
            generateConversationTitle(userMessage);

      const conversation: ChatConversation = {
        id: conversationId,
        title,
        messages: newMessages,
        createdAt: existingConversation?.createdAt || timestamp,
        updatedAt: timestamp,
      };

      try {
        await saveConversation(conversation);

        setState((prev) => ({
          ...prev,
          currentConversationId: conversationId,
          conversationHistory: newMessages,
        }));
      } catch (error) {
        console.error("Failed to save conversation:", error);
        // Show error to user
        setState((prev) => ({
          ...prev,
          error: "Failed to save conversation. Please try again.",
        }));
      }
    },
    [state.currentConversationId, state.conversationHistory]
  );

  // Listen for conversation events from the main ChatHistory component
  useEffect(() => {
    const handleConversationSelected = async (event: any) => {
      console.log(event, "event");
      // Only the conversation ID is passed through the event
      const { id } = event.detail;
      console.log(id, "id");
      if (!id || typeof id !== "string") {
        console.error("No conversation ID provided");
        setState((prev) => ({
          ...prev,
          error: "Invalid conversation selected",
        }));
        return;
      }
      console.log(id, "id");
      try {
        // Fetch the full conversation from SQLite
        const conversation = await getConversationById(id);

        if (conversation) {
          loadConversation(conversation);
        } else {
          console.error(`Conversation ${id} not found in database`);
          setState((prev) => ({
            ...prev,
            error: "Conversation not found. It may have been deleted.",
          }));
        }
      } catch (error) {
        console.error("Failed to load conversation:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to load conversation. Please try again.",
        }));
      }
    };

    const handleNewConversation = () => {
      startNewConversation();
    };

    const handleConversationDeleted = (event: any) => {
      const deletedId = event.detail;
      // If the currently active conversation was deleted, start a new one
      if (state.currentConversationId === deletedId) {
        startNewConversation();
      }
    };

    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === "echo-conversation-selected" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          const { id } = data;
          if (id && typeof id === "string") {
            const conversation = await getConversationById(id);
            if (conversation) {
              loadConversation(conversation);
            }
          }
        } catch (error) {
          console.error("Failed to parse conversation selection:", error);
        }
      }
    };

    window.addEventListener("conversationSelected", handleConversationSelected);
    window.addEventListener("newConversation", handleNewConversation);
    window.addEventListener("conversationDeleted", handleConversationDeleted);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "conversationSelected",
        handleConversationSelected
      );
      window.removeEventListener("newConversation", handleNewConversation);
      window.removeEventListener(
        "conversationDeleted",
        handleConversationDeleted
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadConversation, startNewConversation, state.currentConversationId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_FILES - state.attachedFiles.length;

    if (remainingSlots <= 0) {
      setState((prev) => ({
        ...prev,
        error: `You can only upload ${MAX_FILES} files`,
      }));
      e.target.value = "";
      return;
    }

    const validFiles = files.filter(isAllowedAttachmentFile);
    const filesToAttach = validFiles.slice(0, remainingSlots);

    filesToAttach.forEach((file) => {
      addFile(file);
    });

    if (validFiles.length < files.length) {
      setState((prev) => ({
        ...prev,
        error:
          "Some files were skipped. Allowed types: images, PDF, DOC, DOCX, and TXT.",
      }));
    } else if (validFiles.length > remainingSlots) {
      setState((prev) => ({
        ...prev,
        error: `You can only upload ${MAX_FILES} files`,
      }));
    }

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleScreenshotSubmit = useCallback(
    async (base64: string, autoSubmit = true) => {
      if (state.attachedFiles.length >= MAX_FILES) {
        setState((prev) => ({
          ...prev,
          error: `You can only upload ${MAX_FILES} files`,
        }));
        return;
      }

      const attachedFile: AttachedFile = {
        id: Date.now().toString(),
        name: `screenshot_${Date.now()}.png`,
        type: "image/png",
        base64: base64,
        size: base64.length,
      };

      const updatedAttachedFiles = [...state.attachedFiles, attachedFile];

      setState((prev) => ({
        ...prev,
        attachedFiles: updatedAttachedFiles,
      }));

      if (autoSubmit && !state.isLoading) {
        await submit(undefined, updatedAttachedFiles);
      }
    },
    [state.attachedFiles, state.isLoading, submit]
  );

  const onRemoveAllFiles = () => {
    clearFiles();
    setIsFilesPopoverOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!state.isLoading && state.input.trim()) {
        submit();
      }
    }
  };

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      // Check if clipboard contains images
      const items = e.clipboardData?.items;
      if (!items) return;

      const hasImages = Array.from(items).some((item) =>
        item.type.startsWith("image/")
      );

      // If we have images, prevent default text pasting and process images
      if (hasImages) {
        e.preventDefault();

        const processedFiles: File[] = [];

        Array.from(items).forEach((item) => {
          if (
            item.type.startsWith("image/") &&
            state.attachedFiles.length + processedFiles.length < MAX_FILES
          ) {
            const file = item.getAsFile();
            if (file) {
              processedFiles.push(file);
            }
          }
        });

        // Process all files
        await Promise.all(processedFiles.map((file) => addFile(file)));
      }
    },
    [state.attachedFiles.length, addFile]
  );

  const isPopoverOpen =
    !messageHistoryOpen &&
    (state.isLoading ||
      state.response !== "" ||
      state.error !== null ||
      keepEngaged);

  useEffect(() => {
    resizeWindow(
      isPopoverOpen || micOpen || messageHistoryOpen || isFilesPopoverOpen
    );
  }, [
    isPopoverOpen,
    micOpen,
    messageHistoryOpen,
    resizeWindow,
    isFilesPopoverOpen,
  ]);

  // Auto scroll to bottom when response updates
  useEffect(() => {
    const responseSettings = getResponseSettings();
    if (
      !keepEngaged &&
      state.response &&
      scrollAreaRef.current &&
      responseSettings.autoScroll
    ) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [state.response, keepEngaged]);

  // Keyboard arrow key support for scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPopoverOpen) return;

      const activeScrollRef = scrollAreaRef.current || scrollAreaRef.current;
      const scrollElement = activeScrollRef?.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement;

      if (!scrollElement) return;

      const scrollAmount = 100; // pixels to scroll

      if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollElement.scrollBy({ top: scrollAmount, behavior: "smooth" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollElement.scrollBy({ top: -scrollAmount, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPopoverOpen, scrollAreaRef]);

  // Keyboard shortcut for toggling keep engaged mode (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleToggleShortcut = (e: KeyboardEvent) => {
      // Only trigger when popover is open
      if (!isPopoverOpen) return;

      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setKeepEngaged((prev) => !prev);
        // Focus the input after toggle (with delay to ensure DOM is ready)
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    };

    window.addEventListener("keydown", handleToggleShortcut);
    return () => window.removeEventListener("keydown", handleToggleShortcut);
  }, [isPopoverOpen]);

  const captureScreenshot = useCallback(async () => {
    if (!handleScreenshotSubmit) return;

    const config = screenshotConfigRef.current;
    screenshotInitiatedByThisContext.current = true;
    setIsScreenshotLoading(true);

    try {
      // Check screen recording permission on macOS
      const platform = navigator.platform.toLowerCase();
      if (platform.includes("mac") && !hasCheckedPermissionRef.current) {
        const {
          checkScreenRecordingPermission,
          requestScreenRecordingPermission,
        } = await import("tauri-plugin-macos-permissions-api");

        const hasPermission = await checkScreenRecordingPermission();

        if (!hasPermission) {
          // Request permission
          await requestScreenRecordingPermission();

          // Wait a moment and check again
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const hasPermissionNow = await checkScreenRecordingPermission();

          if (!hasPermissionNow) {
            setState((prev) => ({
              ...prev,
              error:
                "Screen Recording permission required. Please enable it by going to System Settings > Privacy & Security > Screen & System Audio Recording. If you don't see Echo in the list, click the '+' button to add it. If it's already listed, make sure it's enabled. Then restart the app.",
            }));
            setIsScreenshotLoading(false);
            screenshotInitiatedByThisContext.current = false;
            return;
          }
        }
        hasCheckedPermissionRef.current = true;
      }

      if (config.enabled) {
        const base64 = await invoke("capture_to_base64");
        await handleScreenshotSubmit(base64 as string, true);
        screenshotInitiatedByThisContext.current = false;
      } else {
        // Selection Mode: Open overlay to select an area
        isProcessingScreenshotRef.current = false;
        await invoke("start_screen_capture");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to capture screenshot. Please try again.",
      }));
      isProcessingScreenshotRef.current = false;
      screenshotInitiatedByThisContext.current = false;
    } finally {
      if (config.enabled) {
        setIsScreenshotLoading(false);
      }
    }
  }, [handleScreenshotSubmit]);

  useEffect(() => {
    let unlisten: any;

    const setupListener = async () => {
      unlisten = await listen("captured-selection", async (event: any) => {
        if (!screenshotInitiatedByThisContext.current) {
          return;
        }

        if (isProcessingScreenshotRef.current) {
          return;
        }

        isProcessingScreenshotRef.current = true;
        const base64 = event.payload;

        try {
          await handleScreenshotSubmit(base64 as string, true);
        } catch (error) {
          console.error("Error processing selection:", error);
        } finally {
          setIsScreenshotLoading(false);
          screenshotInitiatedByThisContext.current = false;
          setTimeout(() => {
            isProcessingScreenshotRef.current = false;
          }, 100);
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [handleScreenshotSubmit]);

  useEffect(() => {
    const unlisten = listen("capture-closed", () => {
      setIsScreenshotLoading(false);
      isProcessingScreenshotRef.current = false;
      screenshotInitiatedByThisContext.current = false;
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const toggleRecording = useCallback(() => {
    setEnableVAD(!enableVAD);
    setMicOpen(!micOpen);
  }, [enableVAD, micOpen]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      currentRequestIdRef.current = null;
    };
  }, []);

  // register callbacks for global shortcuts
  useEffect(() => {
    globalShortcuts.registerAudioCallback(toggleRecording);
    globalShortcuts.registerInputRef(inputRef.current);
    globalShortcuts.registerScreenshotCallback(captureScreenshot);
  }, [
    globalShortcuts.registerAudioCallback,
    globalShortcuts.registerInputRef,
    globalShortcuts.registerScreenshotCallback,
    toggleRecording,
    captureScreenshot,
    inputRef,
  ]);

  return {
    input: state.input,
    setInput,
    response: state.response,
    setResponse,
    isLoading: state.isLoading,
    error: state.error,
    attachedFiles: state.attachedFiles,
    addFile,
    removeFile,
    clearFiles,
    submit,
    cancel,
    reset,
    setState,
    enableVAD,
    setEnableVAD,
    micOpen,
    setMicOpen,
    currentConversationId: state.currentConversationId,
    conversationHistory: state.conversationHistory,
    loadConversation,
    startNewConversation,
    messageHistoryOpen,
    setMessageHistoryOpen,
    screenshotConfiguration,
    setScreenshotConfiguration,
    handleScreenshotSubmit,
    handleFileSelect,
    handleKeyPress,
    handlePaste,
    isPopoverOpen,
    scrollAreaRef,
    resizeWindow,
    isFilesPopoverOpen,
    setIsFilesPopoverOpen,
    onRemoveAllFiles,
    inputRef,
    captureScreenshot,
    isScreenshotLoading,
    keepEngaged,
    setKeepEngaged,
  };
};
