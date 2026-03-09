import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
} from "@/components";
import { useApp, useTheme } from "@/contexts";
import { PageLayout } from "@/layouts";
import {
  AutoScrollToggle,
  LanguageSelector,
  ResponseLength,
} from "../responses/components";

type AppTheme = "dark" | "light" | "system";

const Settings = () => {
  const { customizable, toggleAppIconVisibility, toggleAlwaysOnTop, toggleAutostart } = useApp();
  const { theme, setTheme, transparency, onSetTransparency } = useTheme();

  return (
    <PageLayout
      title="Settings"
      description="Customize appearance and desktop behavior."
    >
      <div className="space-y-6">
        <section className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-4">
          <h2 className="text-sm font-semibold">Theme</h2>
          <p className="text-xs text-muted-foreground">
            Choose between dark, light, or automatic system theme.
          </p>
          <Select
            value={theme}
            onValueChange={(value) => setTheme(value as AppTheme)}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <section className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Window Transparency</h2>
              <p className="text-xs text-muted-foreground">
                Higher values increase transparency and background blur.
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {transparency}%
            </span>
          </div>
          <Slider
            min={0}
            max={40}
            step={1}
            value={[transparency]}
            onValueChange={([value]) => onSetTransparency(value)}
          />
        </section>

        <section className="space-y-4 rounded-lg border border-border/60 bg-background/60 p-4">
          <h2 className="text-sm font-semibold">Desktop Behavior</h2>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm">Open on Start</p>
              <p className="text-xs text-muted-foreground">
                Launch Echo automatically when your system starts.
              </p>
            </div>
            <Switch
              checked={customizable.autostart.isEnabled}
              onCheckedChange={(checked) => void toggleAutostart(checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm">Show Icon in Dock/Taskbar</p>
              <p className="text-xs text-muted-foreground">
                Keep Echo visible in your OS dock or taskbar.
              </p>
            </div>
            <Switch
              checked={customizable.appIcon.isVisible}
              onCheckedChange={(checked) => void toggleAppIconVisibility(checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm">Disable Window Always on Top</p>
              <p className="text-xs text-muted-foreground">
                Turn this on if you want other windows to appear over Echo.
              </p>
            </div>
            <Switch
              checked={!customizable.alwaysOnTop.isEnabled}
              onCheckedChange={(checked) => void toggleAlwaysOnTop(!checked)}
            />
          </div>
        </section>

        <section className="space-y-5 rounded-lg border border-border/60 bg-background/60 p-4">
          <h2 className="text-sm font-semibold">Responses</h2>
          <ResponseLength />
          <LanguageSelector />
          <AutoScrollToggle />
        </section>
      </div>
    </PageLayout>
  );
};

export default Settings;
