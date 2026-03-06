import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import Header from "@/components/Header/Header";
import { useSettingsStore } from "@/store";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed);
  const compactMode = useSettingsStore((state) => state.compactMode);

  return (
    <div className="flex w-full min-h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 min-h-screen overflow-y-auto z-40 transition-all duration-300",
          "bg-surface border-r border-border shadow-sm",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64",
        )}
      >
        <Header />
        <main className={cn("max-w-7xl", compactMode ? "p-4" : "p-6 lg:p-8")}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
