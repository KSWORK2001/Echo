import { Badge, Button, Card } from "@/components";
import {
  type CalendarEvent,
  useCalendarEvents,
} from "@/hooks";
import { PageLayout } from "@/layouts";
import { listen } from "@tauri-apps/api/event";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface GoogleCalendarAuthEventPayload {
  Ok?: null;
  Err?: string;
}

const getEventLocalDayParts = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return { year, month: month - 1, day, isAllDay: true };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth(),
    day: parsed.getDate(),
    isAllDay: false,
  };
};

const Calendar = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const firstDay = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const leadingBlankDays = firstDay.getDay();

  const cells: Array<number | null> = [
    ...Array.from({ length: leadingBlankDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const monthName = now.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const today = now.getDate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const {
    status,
    setStatus,
    events,
    setEvents,
    error,
    setError,
    loadStatus,
    syncEvents,
    isSyncing,
    getErrorMessage,
  } = useCalendarEvents(false);

  useEffect(() => {
    void loadStatus();

    let unlisten: (() => void) | undefined;
    const setupListener = async () => {
      unlisten = await listen<GoogleCalendarAuthEventPayload | string | null>(
        "google-calendar-auth-complete",
        async (event) => {
          setIsConnecting(false);

          if (typeof event.payload === "string" && event.payload.length > 0) {
            setError(event.payload);
            return;
          }

          if (
            event.payload &&
            typeof event.payload === "object" &&
            "Err" in event.payload &&
            typeof event.payload.Err === "string"
          ) {
            setError(event.payload.Err);
            return;
          }

          setError(null);
          await loadStatus();
          await syncEvents();
        }
      );
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [loadStatus, setError, syncEvents]);

  const connectGoogle = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("calendar_begin_google_auth");
    } catch (err) {
      setError(getErrorMessage(err));
      setIsConnecting(false);
    }
  };

  const disconnectGoogle = async () => {
    setIsDisconnecting(true);
    setError(null);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("calendar_disconnect_google");
      setStatus({
        provider: "google",
        connected: false,
        email: null,
        expires_at: null,
      });
      setEvents([]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsDisconnecting(false);
    }
  };

  const eventsByDay = useMemo(() => {
    const grouped = new Map<number, CalendarEvent[]>();

    events.forEach((event) => {
      if (!event.start) {
        return;
      }

      const dayParts = getEventLocalDayParts(event.start);
      if (!dayParts) {
        return;
      }

      if (dayParts.year !== currentYear || dayParts.month !== currentMonth) {
        return;
      }

      const dayEvents = grouped.get(dayParts.day) ?? [];
      dayEvents.push(event);
      dayEvents.sort((left, right) => {
        const leftTime = left.start ? new Date(left.start).getTime() : 0;
        const rightTime = right.start ? new Date(right.start).getTime() : 0;
        return leftTime - rightTime;
      });
      grouped.set(dayParts.day, dayEvents);
    });

    return grouped;
  }, [currentMonth, currentYear, events]);

  return (
    <PageLayout
      title="Calendar"
      description="Connect Google Calendar to bring your meetings into Echo."
    >
      <Card className="border-border/60 bg-background/70">
        <div className="flex flex-col gap-4 p-4 md:p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">Google Calendar</h2>
              <Badge variant={status?.connected ? "default" : "outline"}>
                {status?.connected ? "Connected" : "Not connected"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {status?.connected
                ? `Signed in as ${status.email || "your Google account"}`
                : "Sign in with Google to sync upcoming meetings and events into Echo."}
            </p>
            <p className="text-xs text-muted-foreground">
              Redirect URI: `http://127.0.0.1:43821/google/callback`
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={connectGoogle} disabled={isConnecting || !!status?.connected}>
              {isConnecting ? (
                <>
                  Connecting <Loader2 className="size-4 animate-spin" />
                </>
              ) : (
                "Connect Google"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={syncEvents}
              disabled={!status?.connected || isSyncing}
            >
              {isSyncing ? (
                <>
                  Syncing <Loader2 className="size-4 animate-spin" />
                </>
              ) : (
                <>
                  Sync <RefreshCw className="size-4" />
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={disconnectGoogle}
              disabled={!status?.connected || isDisconnecting}
            >
              {isDisconnecting ? (
                <>
                  Disconnecting <Loader2 className="size-4 animate-spin" />
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <div className="p-4 md:p-6 text-sm text-destructive">{error}</div>
        </Card>
      ) : null}

      <Card className="border-border/60 bg-background/70">
        <div className="p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{monthName}</h2>
            <p className="text-xs text-muted-foreground">Local time</p>
          </div>

          {!status?.connected ? (
            <div className="mb-4 rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              Connect Google Calendar to populate this monthly view with your events.
            </div>
          ) : null}

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground mb-2">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((day, index) => {
              const isToday = day === today;
              const dayEvents = day === null ? [] : eventsByDay.get(day) ?? [];
              return (
                <div
                  key={`${day ?? "blank"}-${index}`}
                  className={`min-h-28 rounded-lg border p-2 text-sm ${
                    day === null
                      ? "border-transparent"
                      : isToday
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-border/60 bg-muted/20"
                  }`}
                >
                  {day === null ? null : (
                    <div className="flex h-full flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isToday ? "font-semibold" : "font-medium"}`}>
                          {day}
                        </span>
                        {dayEvents.length > 0 ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                            {dayEvents.length}
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <a
                            key={event.id}
                            href={event.html_link ?? undefined}
                            target={event.html_link ? "_blank" : undefined}
                            rel={event.html_link ? "noreferrer" : undefined}
                            className="block rounded-md bg-background/70 px-2 py-1 text-[10px] leading-tight text-foreground/90"
                          >
                            <p className="truncate font-medium">{event.title}</p>
                            <p className="truncate text-muted-foreground">
                              {event.start
                                ? (() => {
                                    const dayParts = getEventLocalDayParts(event.start);
                                    if (!dayParts || dayParts.isAllDay) {
                                      return "All day";
                                    }

                                    return new Date(event.start).toLocaleTimeString([], {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    });
                                  })()
                                : "All day"}
                            </p>
                          </a>
                        ))}

                        {dayEvents.length > 3 ? (
                          <p className="px-1 text-[10px] text-muted-foreground">
                            +{dayEvents.length - 3} more
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </PageLayout>
  );
};

export default Calendar;
