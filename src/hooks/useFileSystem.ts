"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";
import {
  NativeFileSystemProvider,
  isFileSystemAccessSupported,
} from "@/lib/fs/file-system-provider";
import { scanSdCard, writeChangesToSdCard } from "@/lib/core/manager";
import { createGdItem } from "@/lib/core/gd-item";
import { GDEMU_FOLDER_PATTERN } from "@/lib/core/enums";

export function useFileSystem() {
  const {
    setRootHandle,
    setItems,
    setLoading,
    setLoadingProgress,
    setIsWritable,
    setError,
  } = useGameStore();

  const fs = useMemo(() => new NativeFileSystemProvider(), []);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(isFileSystemAccessSupported());
  }, []);

  const pickDirectory = useCallback(async () => {
    setError(null);
    const handle = await fs.openDirectory();
    return handle;
  }, [fs, setError]);

  const scanDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
    const t = useSettingsStore.getState().t;
    try {
      setRootHandle(handle);
      setIsWritable(fs.isWritable);
      setLoading(true, t("fs.scanning"));

      const items = await scanSdCard(handle, fs, (progress) => {
        setLoadingProgress((progress.current / progress.total) * 100);
      });

      setLoading(false);
      return items;
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : t("fs.openFailed"));
      throw e;
    }
  }, [fs, setRootHandle, setLoading, setLoadingProgress, setIsWritable, setError]);

  const loadDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
    const items = await scanDirectory(handle);
    setItems(items);
  }, [scanDirectory, setItems]);

  const openDirectory = useCallback(async () => {
    const t = useSettingsStore.getState().t;
    try {
      const handle = await pickDirectory();
      if (!handle) return;
      await loadDirectory(handle);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : t("fs.openFailed"));
    }
  }, [pickDirectory, loadDirectory, setLoading, setError]);

  const saveChanges = useCallback(async () => {
    const t = useSettingsStore.getState().t;
    const currentRootHandle = useGameStore.getState().rootHandle;
    const currentItems = useGameStore.getState().items;

    if (!currentRootHandle) {
      setError(t("fs.noRoot"));
      return;
    }

    try {
      setLoading(true, t("fs.saving"));

      await writeChangesToSdCard(currentRootHandle, currentItems, fs, (progress) => {
        setLoadingProgress((progress.current / progress.total) * 100);
        const phaseLabel = progress.phase === "renaming" ? t("fs.renamingFolders") : t("fs.writingNames");
        useGameStore.getState().setLoading(true, `${phaseLabel}: ${progress.currentItem}`);
      });

      setLoading(true, t("fs.rescanning"));
      const newItems = await scanSdCard(currentRootHandle, fs, (progress) => {
        setLoadingProgress((progress.current / progress.total) * 100);
      });

      setItems(newItems);
      setLoading(false);
      useGameStore.getState().setSaveSuccess(true);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : t("fs.saveFailed"));
    }
  }, [fs, setItems, setLoading, setLoadingProgress, setError]);

  const addGames = useCallback(async () => {
    const t = useSettingsStore.getState().t;
    try {
      setError(null);
      const handle = await window.showDirectoryPicker({ mode: "read" });
      if (!handle) return;

      const subDirs = await fs.listDirectories(handle);
      const gameSubDirs = subDirs.filter((d) => GDEMU_FOLDER_PATTERN.test(d.name));

      const currentItems = useGameStore.getState().items;
      const currentRootHandle = useGameStore.getState().rootHandle;

      if (!currentRootHandle) {
        setError(t("fs.noRootAdd"));
        return;
      }

      setLoading(true, t("fs.adding"));

      if (gameSubDirs.length > 0) {
        const newItems = await scanSdCard(handle, fs, (progress) => {
          setLoadingProgress((progress.current / progress.total) * 100);
        });

        let nextFolder = currentItems.length > 0
          ? Math.max(...currentItems.map((i) => i.folderNumber)) + 1
          : 1;

        const itemsToAdd = newItems.map((item) => ({
          ...item,
          folderNumber: nextFolder++,
          fullPath: String(nextFolder - 1).padStart(2, "0"),
          sdCardPath: String(nextFolder - 1).padStart(2, "0"),
          isMenu: false,
          id: `gd-${String(nextFolder - 1).padStart(2, "0")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        }));

        setItems([...currentItems, ...itemsToAdd]);
      } else {
        const files = await fs.listFiles(handle);
        const hasGameFiles = files.some((f) => {
          const name = f.name.toLowerCase();
          return name.endsWith(".gdi") || name.endsWith(".cdi") || name.endsWith(".mds") || name.endsWith(".ccd") || name.endsWith(".nrg") || name.endsWith(".iso");
        });

        if (!hasGameFiles) {
          setLoading(false);
          setError(t("fs.noGameFiles"));
          return;
        }

        const nextFolder = currentItems.length > 0
          ? Math.max(...currentItems.map((i) => i.folderNumber)) + 1
          : 2;

        const newItem = createGdItem(nextFolder, handle.name, handle);
        newItem.id = `gd-${String(nextFolder).padStart(2, "0")}-${Date.now()}`;

        setItems([...currentItems, newItem]);
      }

      setLoading(false);
    } catch (e) {
      setLoading(false);
      if (e instanceof DOMException && e.name === "AbortError") return;
      const t = useSettingsStore.getState().t;
      setError(e instanceof Error ? e.message : t("fs.addFailed"));
    }
  }, [fs, setItems, setLoading, setLoadingProgress, setError]);

  return { openDirectory, pickDirectory, scanDirectory, loadDirectory, setItems, saveChanges, addGames, isSupported, isWritable: fs.isWritable };
}
