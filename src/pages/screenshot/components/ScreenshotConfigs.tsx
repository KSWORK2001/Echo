import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Header,
} from "@/components";
import { UseSettingsReturn } from "@/types";
import { LaptopMinimalIcon, MousePointer2Icon } from "lucide-react";

export const ScreenshotConfigs = ({
  screenshotConfiguration,
  handleScreenshotEnabledChange,
}: UseSettingsReturn) => {
  return (
    <div id="screenshot" className="space-y-3">
      <div className="space-y-3">
        {/* Screenshot Capture Mode: Selection and Screenshot */}
        <div className="space-y-2">
          <div className="flex flex-col">
            <Header
              title="Capture Method"
              description={
                screenshotConfiguration.enabled
                  ? "Screenshot Mode: Quickly capture the entire screen with one click."
                  : "Selection Mode: Click and drag to select a specific area to capture."
              }
            />
          </div>
          <Select
            value={screenshotConfiguration.enabled ? "screenshot" : "selection"}
            onValueChange={(value) =>
              handleScreenshotEnabledChange(value === "screenshot")
            }
          >
            <SelectTrigger className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors">
              <div className="flex items-center gap-2">
                {screenshotConfiguration.enabled ? (
                  <LaptopMinimalIcon className="size-4" />
                ) : (
                  <MousePointer2Icon className="size-4" />
                )}
                <div className="text-sm font-medium">
                  {screenshotConfiguration.enabled
                    ? "Screenshot Mode"
                    : "Selection Mode"}
                </div>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selection">
                <div className="flex items-center gap-2">
                  <MousePointer2Icon className="size-4" />
                  <div className="font-medium">Selection Mode</div>
                </div>
              </SelectItem>
              <SelectItem value="screenshot" className="flex flex-row gap-2">
                <LaptopMinimalIcon className="size-4" />
                <div className="font-medium">Screenshot Mode</div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
