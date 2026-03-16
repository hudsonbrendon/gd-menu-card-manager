export interface FileSystemProvider {
  readonly isWritable: boolean;
  openDirectory(): Promise<FileSystemDirectoryHandle | null>;
  readTextFile(dirHandle: FileSystemDirectoryHandle, name: string): Promise<string | null>;
  readBinaryFile(dirHandle: FileSystemDirectoryHandle, name: string): Promise<ArrayBuffer | null>;
  writeTextFile(dirHandle: FileSystemDirectoryHandle, name: string, content: string): Promise<void>;
  deleteEntry(dirHandle: FileSystemDirectoryHandle, name: string): Promise<void>;
  createDirectory(dirHandle: FileSystemDirectoryHandle, name: string): Promise<FileSystemDirectoryHandle>;
  renameDirectory(parentHandle: FileSystemDirectoryHandle, oldName: string, newName: string): Promise<void>;
  canRenameDirectories(parentHandle: FileSystemDirectoryHandle): Promise<boolean>;
  listDirectories(dirHandle: FileSystemDirectoryHandle): Promise<{ name: string; handle: FileSystemDirectoryHandle }[]>;
  listFiles(dirHandle: FileSystemDirectoryHandle): Promise<{ name: string; handle: FileSystemFileHandle }[]>;
  getFileSize(fileHandle: FileSystemFileHandle): Promise<number>;
  getFile(fileHandle: FileSystemFileHandle): Promise<File>;
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export class NativeFileSystemProvider implements FileSystemProvider {
  readonly isWritable = true;
  private _canRename: boolean | null = null;

  async openDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
      return await window.showDirectoryPicker({ mode: "readwrite" });
    } catch {
      return null;
    }
  }

  async readTextFile(dirHandle: FileSystemDirectoryHandle, name: string): Promise<string | null> {
    try {
      const fileHandle = await dirHandle.getFileHandle(name);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch {
      return null;
    }
  }

  async readBinaryFile(dirHandle: FileSystemDirectoryHandle, name: string): Promise<ArrayBuffer | null> {
    try {
      const fileHandle = await dirHandle.getFileHandle(name);
      const file = await fileHandle.getFile();
      return await file.arrayBuffer();
    } catch {
      return null;
    }
  }

  async writeTextFile(dirHandle: FileSystemDirectoryHandle, name: string, content: string): Promise<void> {
    const fileHandle = await dirHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async deleteEntry(dirHandle: FileSystemDirectoryHandle, name: string): Promise<void> {
    await dirHandle.removeEntry(name, { recursive: true });
  }

  async createDirectory(dirHandle: FileSystemDirectoryHandle, name: string): Promise<FileSystemDirectoryHandle> {
    return await dirHandle.getDirectoryHandle(name, { create: true });
  }

  async renameDirectory(parentHandle: FileSystemDirectoryHandle, oldName: string, newName: string): Promise<void> {
    const oldDir = await parentHandle.getDirectoryHandle(oldName);

    // Strategy 1: Try native directory move() (works in OPFS, may work on some local FS)
    if (typeof (oldDir as any).move === "function") {
      try {
        await (oldDir as any).move(parentHandle, newName);
        return;
      } catch {
        // Directory move not supported on this filesystem, try file-level move
      }
    }

    // Strategy 2: Create new dir + move individual files via FileSystemFileHandle.move()
    // File-level move() IS supported on local filesystem in Chrome 110+ and is instant
    const newDir = await parentHandle.getDirectoryHandle(newName, { create: true });
    const fileMoveWorked = await this.moveDirectoryContents(oldDir, newDir);

    if (fileMoveWorked) {
      // All files moved successfully, remove the now-empty old directory
      await parentHandle.removeEntry(oldName, { recursive: true });
      return;
    }

    // Strategy 3: Last resort — full copy (slow for large files)
    // Clean up the partially-moved newDir and start fresh
    try { await parentHandle.removeEntry(newName, { recursive: true }); } catch {}
    const freshNewDir = await parentHandle.getDirectoryHandle(newName, { create: true });
    await this.copyDirectoryRecursive(oldDir, freshNewDir);
    await parentHandle.removeEntry(oldName, { recursive: true });
  }

  /**
   * Move all contents from srcDir to destDir using FileSystemFileHandle.move().
   * Returns true if all moves succeeded, false if move() is not supported.
   */
  private async moveDirectoryContents(
    srcDir: FileSystemDirectoryHandle,
    destDir: FileSystemDirectoryHandle,
  ): Promise<boolean> {
    for await (const [entryName, entry] of srcDir.entries()) {
      if (entry.kind === "file") {
        const fileHandle = entry as FileSystemFileHandle;
        if (typeof (fileHandle as any).move !== "function") {
          return false; // move() not available
        }
        try {
          await (fileHandle as any).move(destDir, entryName);
        } catch {
          return false; // move() failed
        }
      } else if (entry.kind === "directory") {
        // Recursively handle subdirectories
        const subDestDir = await destDir.getDirectoryHandle(entryName, { create: true });
        const ok = await this.moveDirectoryContents(entry as FileSystemDirectoryHandle, subDestDir);
        if (!ok) return false;
        // Remove now-empty source subdirectory
        await srcDir.removeEntry(entryName);
      }
    }
    return true;
  }

  private async copyDirectoryRecursive(
    srcDir: FileSystemDirectoryHandle,
    destDir: FileSystemDirectoryHandle,
  ): Promise<void> {
    for await (const [entryName, entry] of srcDir.entries()) {
      if (entry.kind === "file") {
        const file = await (entry as FileSystemFileHandle).getFile();
        const newFileHandle = await destDir.getFileHandle(entryName, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(file);
        await writable.close();
      } else if (entry.kind === "directory") {
        const subDir = await destDir.getDirectoryHandle(entryName, { create: true });
        await this.copyDirectoryRecursive(entry as FileSystemDirectoryHandle, subDir);
      }
    }
  }

  async canRenameDirectories(parentHandle: FileSystemDirectoryHandle): Promise<boolean> {
    // Cache result — only test once per session
    if (this._canRename !== null) return this._canRename;

    const testName = `__gdtest_${Date.now()}`;
    try {
      // Create a test directory with a test file
      const testDir = await parentHandle.getDirectoryHandle(testName, { create: true });
      const testFileHandle = await testDir.getFileHandle("__test.tmp", { create: true });
      const writable = await testFileHandle.createWritable();
      await writable.write("test");
      await writable.close();

      // Try to move the file to test if file-level move() works
      const testName2 = `${testName}_2`;
      const testDir2 = await parentHandle.getDirectoryHandle(testName2, { create: true });

      let canMove = false;
      if (typeof (testFileHandle as any).move === "function") {
        try {
          await (testFileHandle as any).move(testDir2, "__test.tmp");
          canMove = true;
        } catch {
          canMove = false;
        }
      }

      // Clean up
      try { await parentHandle.removeEntry(testName, { recursive: true }); } catch {}
      try { await parentHandle.removeEntry(testName2, { recursive: true }); } catch {}

      this._canRename = canMove;
      return canMove;
    } catch {
      try { await parentHandle.removeEntry(testName); } catch {}
      try { await parentHandle.removeEntry(`${testName}_2`, { recursive: true }); } catch {}
      this._canRename = false;
      return false;
    }
  }

  async listDirectories(dirHandle: FileSystemDirectoryHandle): Promise<{ name: string; handle: FileSystemDirectoryHandle }[]> {
    const dirs: { name: string; handle: FileSystemDirectoryHandle }[] = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === "directory") {
        dirs.push({ name, handle: handle as FileSystemDirectoryHandle });
      }
    }
    return dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }

  async listFiles(dirHandle: FileSystemDirectoryHandle): Promise<{ name: string; handle: FileSystemFileHandle }[]> {
    const files: { name: string; handle: FileSystemFileHandle }[] = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === "file") {
        files.push({ name, handle: handle as FileSystemFileHandle });
      }
    }
    return files.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getFileSize(fileHandle: FileSystemFileHandle): Promise<number> {
    const file = await fileHandle.getFile();
    return file.size;
  }

  async getFile(fileHandle: FileSystemFileHandle): Promise<File> {
    return await fileHandle.getFile();
  }
}
