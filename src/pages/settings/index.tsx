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
import { Monitor, Palette, PlaySquare, Rows3, Sparkles, Workflow } from "lucide-react";
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section className="rounded-xl border border-border/60 bg-background">
            <div className="border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-foreground">
                  <Palette className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Appearance</h2>
                  <p className="text-xs text-muted-foreground">
                    Theme and window presentation.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/60">
              <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Theme
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose between dark, light, or automatic system theme.
                  </p>
                </div>
                <Select
                  value={theme}
                  onValueChange={(value) => setTheme(value as AppTheme)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Monitor className="h-4 w-4 text-primary" />
                      Window Transparency
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Higher values increase transparency and background blur.
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums text-foreground/80">
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
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border/60 bg-background">
            <div className="border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-foreground">
                  <Workflow className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Desktop Behavior</h2>
                  <p className="text-xs text-muted-foreground">
                    Startup and window behavior.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/60">
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <PlaySquare className="h-4 w-4 text-primary" />
                    Open on Start
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Launch Echo automatically when your system starts.
                  </p>
                </div>
                <Switch
                  checked={customizable.autostart.isEnabled}
                  onCheckedChange={(checked) => void toggleAutostart(checked)}
                />
              </div>

              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Rows3 className="h-4 w-4 text-primary" />
                    Show Icon in Dock/Taskbar
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep Echo visible in your OS dock or taskbar.
                  </p>
                </div>
                <Switch
                  checked={customizable.appIcon.isVisible}
                  onCheckedChange={(checked) => void toggleAppIconVisibility(checked)}
                />
              </div>

              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Monitor className="h-4 w-4 text-primary" />
                    Disable Window Always on Top
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Turn this on if you want other windows to appear over Echo.
                  </p>
                </div>
                <Switch
                  checked={!customizable.alwaysOnTop.isEnabled}
                  onCheckedChange={(checked) => void toggleAlwaysOnTop(!checked)}
                />
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-border/60 bg-background">
          <div className="border-b border-border/60 px-5 py-4">
            <h2 className="text-sm font-semibold">Responses</h2>
          </div>
          <div className="space-y-5 px-5 py-5">
            <ResponseLength />
            <LanguageSelector />
            <AutoScrollToggle />
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default Settings;
