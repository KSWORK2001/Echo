import { useState, useEffect, useCallback } from "react";
import {
  getAllConversations,
  deleteConversation,
  DOWNLOAD_SUCCESS_DISPLAY_MS,
  fetchAIResponse,
} from "@/lib";
import { useApp } from "@/contexts";
import { ChatConversation } from "@/types/completion";

export type UseHistoryType = ReturnType<typeof useHistory>;

export interface UseHistoryReturn {
  // State
  conversations: ChatConversation[];
  selectedConversationId: string | null;
  viewingConversation: ChatConversation | null;
  downloadedConversations: Set<string>;
  deleteConfirm: string | null;
  isDownloaded: boolean;
  isAttached: boolean;
  isSummarizing: boolean;
  isSummaryDownloaded: boolean;
  generatedSummary: string | null;

  // Actions
  handleViewConversation: (conversation: ChatConversation) => void;
  handleDownloadConversation: (
    conversation: ChatConversation,
    e: React.MouseEvent
  ) => void;
  handleDeleteConfirm: (conversationId: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  handleAttachToOverlay: (conversationId: string) => void;
  handleDownload: (
    conversation: ChatConversation | null,
    e: React.MouseEvent
  ) => void;
  handleSummarizeConversation: (conversation: ChatConversation) => Promise<void>;
  handleDownloadSummary: (
    conversation: ChatConversation | null,
    summary: string,
    e: React.MouseEvent
  ) => void;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  // Utilities
  refreshConversations: () => void;
  isLoading: boolean;
}

export function useHistory(): UseHistoryReturn {
  const { selectedAIProvider, allAiProviders, systemPrompt } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [search, setSearch] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [viewingConversation, setViewingConversation] =
    useState<ChatConversation | null>(null);

  const [downloadedConversations, setDownloadedConversations] = useState<
    Set<string>
  >(new Set());

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isAttached, setIsAttached] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSummaryDownloaded, setIsSummaryDownloaded] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);

  // Function to refresh conversations
  const refreshConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedConversations = await getAllConversations();
      setConversations(loadedConversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load conversations when component mounts or popover opens
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const handleViewConversation = (conversation: ChatConversation) => {
    setViewingConversation(conversation);
  };

  const handleDownloadConversation = (
    conversation: ChatConversation,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    // Show download success state
    setDownloadedConversations((prev) => new Set(prev).add(conversation.id));

    try {
      // Convert conversation to markdown format
      const markdown = generateConversationMarkdown(conversation);

      // Create and download the file
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generateFilename(conversation.title);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download conversation:", error);
      // Remove from success state if download failed
      setDownloadedConversations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(conversation.id);
        return newSet;
      });
      return;
    }

    // Clear success state after display timeout
    setTimeout(() => {
      setDownloadedConversations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(conversation.id);
        return newSet;
      });
    }, DOWNLOAD_SUCCESS_DISPLAY_MS);
  };

  const handleDeleteConfirm = (conversationId: string) => {
    setDeleteConfirm(conversationId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setSelectedConversationId(null);
      setViewingConversation(null);
      await deleteConversation(deleteConfirm);
      setConversations((prev) => prev.filter((c) => c.id !== deleteConfirm));

      // Emit event to notify other components about deletion
      window.dispatchEvent(
        new CustomEvent("conversationDeleted", {
          detail: deleteConfirm,
        })
      );
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSummarizeConversation = async (conversation: ChatConversation) => {
    if (!selectedAIProvider.provider) {
      throw new Error("Please select an AI provider in settings");
    }

    const provider = allAiProviders.find(
      (item) => item.id === selectedAIProvider.provider
    );

    if (!provider) {
      throw new Error("Invalid AI provider selected");
    }

    const transcript = conversation.messages
      .map(
        (message) =>
          `${message.role === "user" ? "Speaker" : "Assistant"}: ${message.content}`
      )
      .join("\n\n");

    const prompt =
      "Summarize this meeting transcript into a clean professional meeting summary with these sections in plain text: Meeting Overview, Key Discussion Points, Decisions, Action Items, Risks or Follow-ups. If owners or deadlines are unclear, say that explicitly.";

    setIsSummarizing(true);
    setGeneratedSummary(null);

    try {
      let summary = "";
      for await (const chunk of fetchAIResponse({
        provider,
        selectedProvider: selectedAIProvider,
        systemPrompt: systemPrompt || undefined,
        history: [],
        userMessage: `${prompt}\n\nConversation title: ${conversation.title}\n\nTranscript:\n${transcript}`,
      })) {
        summary += chunk;
      }

      setGeneratedSummary(summary.trim());
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownloadSummary = (
    conversation: ChatConversation | null,
    summary: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!conversation || !summary.trim()) {
      return;
    }

    try {
      const blob = new Blob([summary], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${generateFilename(conversation.title).replace(/\.md$/, "")}_summary.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsSummaryDownloaded(true);
      setTimeout(() => {
        setIsSummaryDownloaded(false);
      }, DOWNLOAD_SUCCESS_DISPLAY_MS);
    } catch (error) {
      console.error("Failed to download summary:", error);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleAttachToOverlay = (conversationId: string) => {
    // Use localStorage to communicate between windows
    localStorage.setItem(
      "echo-conversation-selected",
      JSON.stringify({ id: conversationId, timestamp: Date.now() })
    );
    setIsAttached(true);
    setTimeout(() => {
      setIsAttached(false);
    }, DOWNLOAD_SUCCESS_DISPLAY_MS);
  };

  const handleDownload = (
    conversation: ChatConversation | null,
    e: React.MouseEvent
  ) => {
    if (conversation) {
      handleDownloadConversation(conversation, e);
      setIsDownloaded(true);
      setTimeout(() => {
        setIsDownloaded(false);
      }, DOWNLOAD_SUCCESS_DISPLAY_MS);
    }
  };

  // Helper functions
  const generateConversationMarkdown = (
    conversation: ChatConversation
  ): string => {
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**Created:** ${new Date(
      conversation.createdAt
    ).toLocaleString()}\n`;
    markdown += `**Updated:** ${new Date(
      conversation.updatedAt
    ).toLocaleString()}\n`;
    markdown += `**Messages:** ${conversation.messages.length}\n\n---\n\n`;

    conversation.messages.forEach((message, index) => {
      const roleLabel = message.role.toUpperCase();
      markdown += `## ${roleLabel}: ${message.content}\n`;

      if (index < conversation.messages.length - 1) {
        markdown += "\n";
      }
    });

    return markdown;
  };

  const generateFilename = (title: string): string => {
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    return `${sanitizedTitle.substring(0, 16)}.md`;
  };

  return {
    // State
    conversations,
    selectedConversationId,
    viewingConversation,
    downloadedConversations,
    deleteConfirm,
    isDownloaded,
    isAttached,
    isSummarizing,
    isSummaryDownloaded,
    generatedSummary,

    // Actions
    handleViewConversation,
    handleDownloadConversation,
    handleDeleteConfirm,
    confirmDelete,
    cancelDelete,
    handleAttachToOverlay,
    handleDownload,
    handleSummarizeConversation,
    handleDownloadSummary,
    // Utilities
    refreshConversations,
    search,
    setSearch,
    isLoading,
  };
}
