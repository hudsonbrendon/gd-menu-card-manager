"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDisplayName, type GdItem } from "@/lib/core/gd-item";
import { useSettingsStore } from "@/store/settings-store";

interface RenameDialogProps {
  item: GdItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (id: string, newName: string) => void;
}

export function RenameDialog({ item, open, onOpenChange, onRename }: RenameDialogProps) {
  const [name, setName] = useState("");
  const { t } = useSettingsStore();

  useEffect(() => {
    if (item) {
      setName(getDisplayName(item));
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onRename(item.id, name.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("rename.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("rename.placeholder")}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("rename.cancel")}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {t("rename.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
