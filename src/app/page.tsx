"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toolbar } from "@/components/game-list/toolbar";
import { GameTable } from "@/components/game-list/game-table";
import { DriveSelector } from "@/components/drive/drive-selector";
import { ProgressDialog } from "@/components/dialogs/progress-dialog";
import { GameInfoPanel } from "@/components/game-list/game-info-panel";
import { ToolbarTutorial } from "@/components/tutorial/toolbar-tutorial";
import { DriveTutorial } from "@/components/tutorial/drive-tutorial";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";

export default function Home() {
  const { items, error, setError } = useGameStore();
  const { initFromStorage } = useSettingsStore();
  const hasItems = items.length > 0;
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  // Auto-select first item when items change
  useEffect(() => {
    if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

  return (
    <div className="flex h-screen flex-col bg-gd-bg font-mono">
      <Header />

      {hasItems ? (
        <>
          <Toolbar />
          <ToolbarTutorial />
          <main className="relative flex-1 flex overflow-hidden">
            <div className="absolute inset-0 dc-scanlines z-50 pointer-events-none" />

            {/* Left panel - Game list */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-gd-border">
              <GameTable
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
              />
            </div>

            {/* Right panel - Game info */}
            <div className="w-[320px] flex-shrink-0 flex flex-col overflow-hidden">
              <GameInfoPanel item={selectedItem} />
            </div>
          </main>
        </>
      ) : (
        <main className="relative flex-1 overflow-hidden flex flex-col">
          <div className="absolute inset-0 dc-scanlines z-50 pointer-events-none" />
          <div className="relative z-0 flex-1 flex flex-col overflow-hidden">
            <DriveSelector />
            <DriveTutorial />
          </div>
        </main>
      )}

      <Footer />
      <ProgressDialog />

      {error && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60]">
          <div className="flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400 shadow-lg backdrop-blur-sm font-mono">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 font-bold hover:opacity-70 transition-opacity"
            >
              x
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
