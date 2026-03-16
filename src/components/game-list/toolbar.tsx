"use client";

import { Search, X } from "lucide-react";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useGameManager } from "@/hooks/useGameManager";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { useState } from "react";

export function Toolbar() {
  const { searchQuery, setSearchQuery, selectedIds, items, isWritable, rootHandle, deselectAll } = useGameStore();
  const { t } = useSettingsStore();
  const { openDirectory, saveChanges, addGames } = useFileSystem();
  const { sortAlphabetically, deleteItem } = useGameManager();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasItems = items.length > 0;
  const hasSelection = selectedIds.size > 0;

  const handleDeleteSelected = () => {
    const ids = [...selectedIds];
    ids.forEach((id) => deleteItem(id));
    deselectAll();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-2 border-b border-gd-border bg-gd-bg">
        <GdBtn id="btn-open" letter="A" color="bg-red-500" textColor="text-white" label={t("toolbar.open")} tooltip={t("toolbar.open.tooltip")} onClick={openDirectory} />

        {hasItems && (
          <>
            <GdBtn id="btn-add" letter="B" color="bg-blue-500" textColor="text-white" label={t("toolbar.add")} tooltip={t("toolbar.add.tooltip")} onClick={addGames} />
            <GdBtn id="btn-sort" letter="X" color="bg-yellow-500" textColor="text-black" label={t("toolbar.sort")} tooltip={t("toolbar.sort.tooltip")} onClick={sortAlphabetically} />

            {hasSelection && (
              <GdBtn
                letter="Y"
                color="bg-yellow-500"
                textColor="text-black"
                label={`${t("toolbar.delete")} (${selectedIds.size})`}
                tooltip={t("toolbar.delete.tooltip", { count: selectedIds.size })}
                onClick={() => setShowDeleteConfirm(true)}
              />
            )}

            <div className="flex-1 flex justify-center">
              <div id="btn-search" className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gd-dim" />
                <input
                  placeholder={t("toolbar.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-1.5 text-sm bg-transparent border border-gd-border text-gd-text placeholder:text-gd-dim/50 focus:outline-none focus:border-gd-text/40 rounded-sm font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gd-dim hover:text-gd-text"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <span className="text-gd-border">|</span>

            <GdBtn
              id="btn-save"
              letter="S"
              color="bg-green-500"
              textColor="text-white"
              label={t("toolbar.save")}
              tooltip={t("toolbar.save.tooltip")}
              onClick={saveChanges}
              disabled={!isWritable || !rootHandle}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("toolbar.deleteDialog.title")}
        description={t("toolbar.deleteDialog.description", { count: selectedIds.size })}
        onConfirm={handleDeleteSelected}
        destructive
      />
    </>
  );
}

function GdBtn({
  id,
  letter,
  color,
  textColor,
  label,
  tooltip,
  onClick,
  disabled,
}: {
  id?: string;
  letter: string;
  color: string;
  textColor: string;
  label: string;
  tooltip?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-mono font-bold tracking-wide transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <span className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-[11px] font-bold ${textColor} shadow-md`}>
        {letter}
      </span>
      <span className="text-gd-text">{label}</span>
    </button>
  );
}
