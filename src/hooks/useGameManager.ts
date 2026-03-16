"use client";

import { useCallback } from "react";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";
import { getDisplayName, getSerial, type GdItem } from "@/lib/core/gd-item";

export function useGameManager() {
  const {
    items,
    searchQuery,
    sortField,
    sortDirection,
    reorderItems,
    renumberFolders,
    setSort,
    removeItem,
    updateItem,
  } = useGameStore();

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = getDisplayName(item).toLowerCase();
    const serial = getSerial(item).toLowerCase();
    return name.includes(query) || serial.includes(query);
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const dir = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "folder":
        return (a.folderNumber - b.folderNumber) * dir;
      case "name":
        return getDisplayName(a).localeCompare(getDisplayName(b)) * dir;
      case "serial":
        return getSerial(a).localeCompare(getSerial(b)) * dir;
      case "size":
        return (a.totalSize - b.totalSize) * dir;
      case "format":
        return a.imageFormat.localeCompare(b.imageFormat) * dir;
      case "region":
        return (a.ip?.areaSymbols || "").localeCompare(b.ip?.areaSymbols || "") * dir;
      default:
        return 0;
    }
  });

  const sortAlphabetically = useCallback(() => {
    const sorted = [...items];
    const menu = sorted.find((i) => i.isMenu);
    const rest = sorted.filter((i) => !i.isMenu);
    rest.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));

    const result = menu ? [menu, ...rest] : rest;
    useGameStore.getState().setItems(result);
    renumberFolders();
  }, [items, renumberFolders]);

  const deleteItem = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      if (item.isMenu) {
        useGameStore.getState().setError(useSettingsStore.getState().t("fs.cannotDeleteMenu"));
        return;
      }
      removeItem(id);
      renumberFolders();
    },
    [items, removeItem, renumberFolders],
  );

  const renameItem = useCallback(
    (id: string, newName: string) => {
      updateItem(id, { nameFromFile: newName });
    },
    [updateItem],
  );

  const toggleSort = useCallback(
    (field: typeof sortField) => {
      if (sortField === field) {
        setSort(field, sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSort(field, "asc");
      }
    },
    [sortField, sortDirection, setSort],
  );

  return {
    items: sortedItems,
    sortAlphabetically,
    deleteItem,
    renameItem,
    toggleSort,
    reorderItems,
    renumberFolders,
  };
}
