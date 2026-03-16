"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getDisplayName, type GdItem } from "@/lib/core/gd-item";

interface GameRowProps {
  item: GdItem;
  isSelected: boolean;
  onSelect: () => void;
  onInfo: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function GameRow({ item, isSelected, onSelect, onInfo, onRename, onDelete }: GameRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = getDisplayName(item);
  const folderNum = String(item.folderNumber).padStart(2, "0");

  const regionSuffix = item.ip?.regions?.length
    ? ` (${item.ip.regions.join("")})`
    : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center px-3 py-[3px] cursor-pointer select-none text-[13px] font-mono transition-colors
        ${isSelected
          ? "bg-gd-highlight text-white"
          : "text-gd-text hover:bg-gd-border/30"
        }
        ${isDragging ? "z-50 shadow-lg" : ""}
        ${item.isMenu ? "text-gd-dim" : ""}
      `}
      onClick={onSelect}
      onDoubleClick={onInfo}
      onContextMenu={(e) => {
        e.preventDefault();
        onRename();
      }}
      {...attributes}
      {...listeners}
    >
      <span className={`w-8 text-right mr-3 flex-shrink-0 ${isSelected ? "text-white" : "text-gd-dim"}`}>
        {folderNum}
      </span>
      <span className="truncate uppercase tracking-wide">
        {item.isMenu ? "GDMENU" : `${displayName}${regionSuffix}`}
      </span>
    </div>
  );
}
