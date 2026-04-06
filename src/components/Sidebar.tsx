import { Button } from "@/components";
import { useCalendarEvents } from "@/hooks";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useMenuItems, useVersion } from "@/hooks";
import echoLogo from "../../images/EchoPNG.png";

export const Sidebar = () => {
  const { version, isLoading } = useVersion();
  const { menu, footerLinks, footerItems } = useMenuItems();
  const { nextUpcomingEvent, status } = useCalendarEvents();

  const navigate = useNavigate();
  const activeRoute = useLocation().pathname;
  return (
    <aside className="flex w-56 flex-col select-none pt-2">
      {/* Logo */}
      <div
        onClick={() => navigate("/chats")}
        className="flex h-16 cursor-pointer items-center px-4 pt-10"
      >
        <img
          src={echoLogo}
          alt="Echo"
          className="h-7 w-auto max-w-[100px] object-contain lg:h-60"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {menu.map((item, index) => (
          <button
            onClick={() => navigate(item.href)}
            key={`${item.label}-${index}`}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs lg:text-sm text-sidebar-foreground/70 transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              activeRoute.includes(item.href)
                ? "font-medium bg-sidebar-accent text-sidebar-accent-foreground"
                : ""
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="size-3 lg:size-4 transition-all duration-300" />
              {item.label}
            </div>
            {item.count ? (
              <span className="flex size-5 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                {item.count}
              </span>
            ) : null}
          </button>
        ))}

        <div className="mx-1 mt-4 rounded-xl border border-border/60 bg-background/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            Next event
          </p>

          {status?.connected && nextUpcomingEvent ? (
            <div className="mt-2 space-y-1">
              <p className="truncate text-xs font-medium text-foreground/90">
                {nextUpcomingEvent.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {nextUpcomingEvent.start
                  ? new Date(nextUpcomingEvent.start).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Time unavailable"}
              </p>
              {nextUpcomingEvent.location ? (
                <p className="truncate text-[11px] text-muted-foreground/90">
                  {nextUpcomingEvent.location}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {status?.connected
                ? "No upcoming events found."
                : "Connect Google Calendar to see your next meeting here."}
            </p>
          )}
        </div>
      </nav>

      <div className="flex flex-col space-y-1 px-3  pb-3">
        <div className="flex flex-row justify-evenly items-center gap-2 mb-3">
          {footerLinks.map((item, index) => (
            <Button
              key={`${item.title}-${index}`}
              title={item.title}
              size="sm"
              variant="outline"
              onClick={() => openUrl(item.link)}
            >
              <item.icon className="size-3 lg:size-4 transition-all duration-300" />
            </Button>
          ))}
        </div>

        <div className="px-3 pb-1 text-[10px] lg:text-xs text-muted-foreground/90">
          {isLoading ? "Loading version..." : `Version ${version}`}
        </div>

        {footerItems.map((item, index) => (
          <button
            type="button"
            onClick={item.action}
            key={`${item.label}-${index}`}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs lg:text-sm text-sidebar-foreground/70 transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="size-3 lg:size-4 transition-all duration-300" />
              {item.label}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};
