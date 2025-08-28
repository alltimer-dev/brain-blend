import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, MessageSquare, Pencil, Check, X } from "lucide-react";
import { useState } from "react";

export type Conversation = {
  id: string;
  title: string;
  model: string;
  updated_at: string;
};

export function SidebarConversations({
  items,
  activeId,
  onSelect,
  onDelete,
  onEdit,
  onNew,
}: {
  items: Conversation[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
  onNew: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onEdit(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-3 flex items-center justify-between">
        <div className="font-medium">Conversations</div>
        <Button size="sm" onClick={onNew} variant="secondary">
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <ul className="p-2 space-y-1">
          {items.map((c) => (
            <li key={c.id} className={"group rounded-md border transition-colors duration-200 " + (activeId === c.id ? "bg-muted border-primary/20" : "bg-background hover:bg-muted/60 hover:border-muted-foreground/20")}>
              {editingId === c.id ? (
                <div className="p-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <div className="text-xs text-muted-foreground truncate">{c.model}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={saveEdit}
                      aria-label="Save changes"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={cancelEdit}
                      aria-label="Cancel edit"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button className="w-full text-left p-3 flex items-center gap-2" onClick={() => onSelect(c.id)}>
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm">{c.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.model}</div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(c.id, c.title);
                      }}
                      aria-label="Edit conversation name"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
                      }}
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </button>
              )}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
