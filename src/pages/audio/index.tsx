import { AudioSelection } from "./components";
import { ScreenshotConfigs } from "../screenshot/components";
import { PageLayout } from "@/layouts";
import { getPlatform } from "@/lib";
import { useSettings } from "@/hooks";

const getOsInstructions = () => {
  const platform = getPlatform();

  switch (platform) {
    case "macos":
      return {
        mic: "System Preferences → Sound → Input",
        audio: "System Preferences → Sound → Output",
      };
    case "windows":
      return {
        mic: "Settings → System → Sound → Input",
        audio: "Settings → System → Sound → Output",
      };
    case "linux":
      return {
        mic: "Sound Settings → Input Devices",
        audio: "Sound Settings → Output Devices",
      };
    default:
      return {
        mic: "your system's sound settings",
        audio: "your system's sound settings",
      };
  }
};

const Audio = () => {
  const osInstructions = getOsInstructions();
  const settings = useSettings();

  return (
    <PageLayout
      title="Inputs"
      description="Manage audio devices and screenshot capture behavior in one place."
    >
      <AudioSelection />

      <div className="text-xs text-amber-600 bg-amber-500/10 p-3 rounded-md mb-4 space-y-2">
        <p>
          <strong>⚠️ If selected devices don't work:</strong> Please verify your
          default system audio settings. Go to{" "}
          <strong>{osInstructions.mic}</strong> for microphone and{" "}
          <strong>{osInstructions.audio}</strong> for speakers/headphones.
          Ensure the correct devices are set as default in your operating
          system.
        </p>
        <p className="text-amber-600/80">
          <strong>Note:</strong> If the selected device fails or is unavailable,
          Echo will automatically fall back to your system's default audio
          devices.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold tracking-tight">Screenshot Settings</h2>
        <ScreenshotConfigs {...settings} />
      </div>
    </PageLayout>
  );
};

export default Audio;
