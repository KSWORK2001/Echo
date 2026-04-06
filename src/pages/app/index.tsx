import { Card, DragButton, CustomCursor, Button } from "@/components";
import { useMemo } from "react";
import {
  SystemAudio,
  Completion,
  AudioVisualizer,
  StatusIndicator,
} from "./components";
import { useApp } from "@/hooks";
import { useApp as useAppContext } from "@/contexts";
import { invoke } from "@tauri-apps/api/core";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorLayout } from "@/layouts";
import { formatShortcutKeyForDisplay, getPlatform, getShortcutsConfig } from "@/lib";
import { DEFAULT_SHORTCUT_ACTIONS } from "@/config";
import echoLogo from "../../../images/echo.ico";

const App = () => {
  const { isHidden, systemAudio } = useApp();
  const { customizable } = useAppContext();
  const platform = getPlatform();

  const keybindTooltip = useMemo(() => {
    const config = getShortcutsConfig();

    const lines = DEFAULT_SHORTCUT_ACTIONS.map((action) => {
      const binding = config.bindings[action.id];
      const displayKey = binding?.key
        ? formatShortcutKeyForDisplay(binding.key)
        : "Not set";
      const status = binding?.enabled === false ? " (Disabled)" : "";
      return `${action.name}: ${displayKey}${status}`;
    });

    return ["Open Dashboard", "", "Keybinds:", ...lines].join("\n");
  }, []);

  const openDashboard = async () => {
    try {
      await invoke("open_dashboard");
    } catch (error) {
      console.error("Failed to open dashboard:", error);
    }
  };

  return (
    <ErrorBoundary
      fallbackRender={() => {
        return <ErrorLayout isCompact />;
      }}
      resetKeys={["app-error"]}
      onReset={() => {
        console.log("Reset");
      }}
    >
      <div
        className={`w-screen h-screen flex overflow-hidden justify-center items-start ${
          isHidden ? "hidden pointer-events-none" : ""
        }`}
      >
        <Card className="w-full flex flex-row items-center gap-2 p-2">
          <SystemAudio {...systemAudio} />
          {systemAudio?.capturing ? (
            <div className="flex flex-row items-center gap-2 justify-between w-full">
              <div className="flex flex-1 items-center gap-2">
                <AudioVisualizer isRecording={systemAudio?.capturing} />
              </div>
              <div className="flex !w-fit items-center gap-2">
                <StatusIndicator
                  setupRequired={systemAudio.setupRequired}
                  error={systemAudio.error}
                  isProcessing={systemAudio.isProcessing}
                  isAIProcessing={systemAudio.isAIProcessing}
                  capturing={systemAudio.capturing}
                  isSpeechActive={systemAudio.isSpeechActive}
                  isMicActive={systemAudio.isMicActive}
                />
              </div>
            </div>
          ) : null}

          <div
            className={`${
              systemAudio?.capturing
                ? "hidden w-full fade-out transition-all duration-300"
                : "w-full flex flex-row gap-2 items-center"
            }`}
          >
            <Completion isHidden={isHidden} />
            <Button
              size={"icon"}
              className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700"
              title={keybindTooltip}
              onClick={openDashboard}
            >
              <img
                src={echoLogo}
                alt="Echo"
                className="h-4 w-4 object-contain"
              />
            </Button>
          </div>

          <DragButton />
        </Card>
        {customizable.cursor.type === "invisible" && platform !== "linux" ? (
          <CustomCursor />
        ) : null}
      </div>
    </ErrorBoundary>
  );
};

export default App;
