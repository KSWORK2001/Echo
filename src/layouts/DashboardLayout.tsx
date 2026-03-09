import { Sidebar } from "@/components";
import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorLayout } from "./ErrorLayout";

export const DashboardLayout = () => {
  return (
    <ErrorBoundary
      fallbackRender={() => {
        return <ErrorLayout />;
      }}
      resetKeys={["dashboard-error"]}
      onReset={() => {
        console.log("Reset");
      }}
    >
      <div className="relative flex h-screen w-screen overflow-hidden bg-background p-3 md:p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(16,185,129,0.2),transparent_34%),radial-gradient(circle_at_82%_84%,rgba(15,23,42,0.08),transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.4),transparent_45%)] dark:bg-[radial-gradient(circle_at_10%_8%,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_82%_84%,rgba(148,163,184,0.12),transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.04),transparent_45%)]" />
        <div className="absolute inset-3 md:inset-4 rounded-3xl border border-border/50 bg-background/70 backdrop-blur-xl shadow-[0_40px_80px_-56px_rgba(15,23,42,0.55)]" />
        {/* Draggable region */}
        <div
          className="absolute left-0 right-0 top-0 z-50 h-10 select-none"
          data-tauri-drag-region={true}
        />

        <div className="relative z-10 flex h-full w-full overflow-hidden rounded-3xl border border-border/35 bg-background/45 backdrop-blur-2xl">
          {/* Sidebar */}
          <Sidebar />
          {/* Main Content */}
          <main className="relative z-10 flex flex-1 flex-col overflow-hidden px-7 md:px-9">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.08),transparent_36%)]" />
            <Outlet />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};
