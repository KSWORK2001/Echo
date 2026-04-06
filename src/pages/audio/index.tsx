import { AudioSelection } from "./components";
import { ScreenshotConfigs } from "../screenshot/components";
import { PageLayout } from "@/layouts";
import { useSettings } from "@/hooks";

const Audio = () => {
  const settings = useSettings();

  return (
    <PageLayout
      title="Inputs"
      description="Manage audio devices and screenshot capture behavior in one place."
    >
      <AudioSelection />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold tracking-tight">Screenshot Settings</h2>
        <ScreenshotConfigs {...settings} />
      </div>
    </PageLayout>
  );
};

export default Audio;
