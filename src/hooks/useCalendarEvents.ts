import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface CalendarConnectionStatus {
  provider: string;
  connected: boolean;
  email: string | null;
  expires_at: number | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  location: string | null;
  description: string | null;
  html_link: string | null;
}

const getErrorMessage = (err: unknown) => {
  if (typeof err === "string") {
    return err;
  }

  if (err instanceof Error) {
    return err.message;
  }

  if (err && typeof err === "object") {
    if ("Err" in err && typeof err.Err === "string") {
      return err.Err;
    }

    if ("message" in err && typeof err.message === "string") {
      return err.message;
    }

    try {
      return JSON.stringify(err);
    } catch {
      return "Unknown calendar error";
    }
  }

  return "Unknown calendar error";
};

export const useCalendarEvents = (autoLoad = true) => {
  const [status, setStatus] = useState<CalendarConnectionStatus | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const nextStatus = await invoke<CalendarConnectionStatus>(
        "calendar_get_google_status"
      );
      setStatus(nextStatus);
      return nextStatus;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  const syncEvents = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const syncedEvents = await invoke<CalendarEvent[]>(
        "calendar_sync_google_events"
      );
      setEvents(syncedEvents);
      await loadStatus();
      return syncedEvents;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setIsSyncing(false);
    }
  }, [loadStatus]);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      try {
        const nextStatus = await loadStatus();
        if (isMounted && nextStatus.connected) {
          await syncEvents();
        }
      } catch {
        return;
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  }, [autoLoad, loadStatus, syncEvents]);

  const nextUpcomingEvent = useMemo(() => {
    const now = Date.now();

    return [...events]
      .filter((event) => event.start)
      .map((event) => ({
        ...event,
        startTime: new Date(event.start as string).getTime(),
      }))
      .filter((event) => !Number.isNaN(event.startTime) && event.startTime >= now)
      .sort((left, right) => left.startTime - right.startTime)[0] ?? null;
  }, [events]);

  return {
    status,
    setStatus,
    events,
    setEvents,
    error,
    setError,
    isLoadingStatus,
    isSyncing,
    loadStatus,
    syncEvents,
    nextUpcomingEvent,
    getErrorMessage,
  };
};
