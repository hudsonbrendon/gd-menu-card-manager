"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useGameManager } from "@/hooks/useGameManager";
import { useSettingsStore } from "@/store/settings-store";
import { GameRow } from "./game-row";
import { InfoDialog } from "@/components/dialogs/info-dialog";
import { RenameDialog } from "@/components/dialogs/rename-dialog";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { getDisplayName, type GdItem } from "@/lib/core/gd-item";

interface GameTableProps {
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
}

export function GameTable({ selectedItemId, onSelectItem }: GameTableProps) {
  const { t } = useSettingsStore();
  const { items, deleteItem, renameItem, reorderItems, renumberFolders } = useGameManager();

  const [infoItem, setInfoItem] = useState<GdItem | null>(null);
  const [renameItem_, setRenameItem] = useState<GdItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<GdItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        if (newIndex === 0 && items[0]?.isMenu) return;
        if (oldIndex === 0 && items[0]?.isMenu) return;

        reorderItems(oldIndex, newIndex);
        renumberFolders();
      }
    },
    [items, reorderItems, renumberFolders],
  );

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirm) {
      deleteItem(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, deleteItem]);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div id="game-list" className="flex-1 overflow-auto dc-scrollbar min-h-0">
            {items.map((item) => (
              <GameRow
                key={item.id}
                item={item}
                isSelected={item.id === selectedItemId}
                onSelect={() => onSelectItem(item.id)}
                onInfo={() => setInfoItem(item)}
                onRename={() => setRenameItem(item)}
                onDelete={() => setDeleteConfirm(item)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <InfoDialog item={infoItem} open={!!infoItem} onOpenChange={(open) => !open && setInfoItem(null)} />
      <RenameDialog
        item={renameItem_}
        open={!!renameItem_}
        onOpenChange={(open) => !open && setRenameItem(null)}
        onRename={renameItem}
      />
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title={t("table.deleteDialog.title")}
        description={t("table.deleteDialog.description", { name: deleteConfirm ? getDisplayName(deleteConfirm) : "" })}
        onConfirm={handleConfirmDelete}
        destructive
      />
    </div>
  );
}
