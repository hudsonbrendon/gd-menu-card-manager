export interface FileSystemProvider {
  readonly isWritable: boolean;
  openDirectory(): Promise<FileSystemDirectoryHandle | null>;
  readTextFile(dirHandle: FileSystemDirectoryHandle, name: string): Promise<string | null>;
  readBinaryFile(dirHandle: FileSystemDirectoryHandle, name: string): Promise<ArrayBuffer | null>;
  writeTextFile(dirHandle: FileSystemDirectoryHandle, name: string, content: string): Promise<void>;
  deleteEntry(dirHandle: FileSystemDirectoryHandle, name: string): Promise<void>;
  createDirectory(dirHandle: FileSystemDirectoryHandle, name: string): Promise<FileSystemDirectoryHandle>;
  renameDirectory(parentHandle: FileSystemDirectoryHandle, oldName: string, newName: string): Promise<void>;
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

    // Try native move/rename first (Chrome 110+) — instant, no data copy
    if (typeof (oldDir as any).move === "function") {
      await (oldDir as any).move(newName);
      return;
    }

    // Fallback: copy all files to new directory and delete old one
    const newDir = await parentHandle.getDirectoryHandle(newName, { create: true });
    await this.copyDirectory(oldDir, newDir);
    await parentHandle.removeEntry(oldName, { recursive: true });
  }

  private async copyDirectory(
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
        await this.copyDirectory(entry as FileSystemDirectoryHandle, subDir);
      }
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
