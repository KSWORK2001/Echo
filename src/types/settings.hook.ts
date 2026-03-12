import { TYPE_PROVIDER } from "./provider.type";
import { ScreenshotConfig } from "./settings";

export interface UseSettingsReturn {
  screenshotConfiguration: ScreenshotConfig;
  setScreenshotConfiguration: React.Dispatch<
    React.SetStateAction<ScreenshotConfig>
  >;
  handleScreenshotEnabledChange: (enabled: boolean) => void;
  allAiProviders: TYPE_PROVIDER[];
  allSttProviders: TYPE_PROVIDER[];
  selectedAIProvider: { provider: string; variables: Record<string, string> };
  selectedSttProvider: {
    provider: string;
    variables: Record<string, string>;
  };
  onSetSelectedAIProvider: (provider: {
    provider: string;
    variables: Record<string, string>;
  }) => void;
  onSetSelectedSttProvider: (provider: {
    provider: string;
    variables: Record<string, string>;
  }) => void;
  handleDeleteAllChatsConfirm: () => void;
  showDeleteConfirmDialog: boolean;
  setShowDeleteConfirmDialog: React.Dispatch<React.SetStateAction<boolean>>;
  variables: { key: string; value: string }[];
  sttVariables: { key: string; value: string }[];
  hasActiveLicense: boolean;
}
