import { create } from "zustand";
import type { GdItem } from "@/lib/core/gd-item";

export type SortField = "folder" | "name" | "serial" | "size" | "format" | "region";
export type SortDirection = "asc" | "desc";

interface GameState {
  items: GdItem[];
  selectedIds: Set<string>;
  rootHandle: FileSystemDirectoryHandle | null;
  isLoading: boolean;
  loadingMessage: string;
  loadingProgress: number;
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
  isWritable: boolean;
  error: string | null;
  saveSuccess: boolean;

  // Actions
  setItems: (items: GdItem[]) => void;
  addItem: (item: GdItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<GdItem>) => void;
  setSelectedIds: (ids: Set<string>) => void;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setRootHandle: (handle: FileSystemDirectoryHandle | null) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setLoadingProgress: (progress: number) => void;
  setSearchQuery: (query: string) => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  setIsWritable: (writable: boolean) => void;
  setError: (error: string | null) => void;
  setSaveSuccess: (success: boolean) => void;
  reorderItems: (fromIndex: number, toIndex: number) => void;
  renumberFolders: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  items: [],
  selectedIds: new Set(),
  rootHandle: null,
  isLoading: false,
  loadingMessage: "",
  loadingProgress: 0,
  searchQuery: "",
  sortField: "folder",
  sortDirection: "asc",
  isWritable: false,
  error: null,
  saveSuccess: false,

  setItems: (items) => set({ items }),

  addItem: (item) => set((state) => ({ items: [...state.items, item] })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      selectedIds: new Set([...state.selectedIds].filter((sid) => sid !== id)),
    })),

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    })),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleSelected: (id) =>
    set((state) => {
      const newSelected = new Set(state.selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedIds: newSelected };
    }),

  selectAll: () =>
    set((state) => ({
      selectedIds: new Set(state.items.map((item) => item.id)),
    })),

  deselectAll: () => set({ selectedIds: new Set() }),

  setRootHandle: (handle) => set({ rootHandle: handle }),

  setLoading: (loading, message = "") =>
    set({ isLoading: loading, loadingMessage: message, loadingProgress: 0 }),

  setLoadingProgress: (progress) => set({ loadingProgress: progress }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSort: (field, direction) =>
    set({ sortField: field, sortDirection: direction }),

  setIsWritable: (writable) => set({ isWritable: writable }),

  setError: (error) => set({ error }),
  setSaveSuccess: (success) => set({ saveSuccess: success }),

  reorderItems: (fromIndex, toIndex) =>
    set((state) => {
      const items = [...state.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { items };
    }),

  renumberFolders: () =>
    set((state) => {
      const items = state.items.map((item, index) => ({
        ...item,
        folderNumber: index + 1,
        fullPath: String(index + 1).padStart(2, "0"),
        sdCardPath: String(index + 1).padStart(2, "0"),
        isMenu: index === 0,
      }));
      return { items };
    }),
}));
