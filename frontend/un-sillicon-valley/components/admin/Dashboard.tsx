"use client";

import { useState } from "react";
import { Sidebar } from "@/components/admin/AdminSidebar";
import EntriesView from "@/components/views/EntriesView";
import CommentsView from "@/components/views/CommentsView";

type View = "entries" | "comments";

export function DashboardShell() {
  const [activeView, setActiveView] = useState<View>("entries");

  function renderView() {
    switch (activeView) {
      case "entries":
        return <EntriesView />;

      case "comments":
        return <CommentsView />;

      default:
        return null;
    }
  }

  return (
    <div>
      <Sidebar
        activeView={activeView}
        onChangeView={setActiveView}
      />

      <main className="ml-64 min-h-screen p-6">
        {renderView()}
      </main>
    </div>
  );
}