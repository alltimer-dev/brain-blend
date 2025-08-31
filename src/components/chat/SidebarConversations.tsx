import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength) + "...";
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
            <li key={c.id} className={"group rounded-md border transition-colors duration-200 w-full " + (activeId === c.id ? "bg-muted border-primary/20" : "bg-background hover:bg-muted/60 hover:border-muted-foreground/20")}>
              {editingId === c.id ? (
                <div className="p-3 flex items-center gap-2 w-full">
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="h-7 text-sm w-full"
                      autoFocus
                    />
                    <div className="text-xs text-muted-foreground truncate mt-1">{c.model}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      className="h-7 w-7 p-0 flex items-center justify-center rounded-md text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                      onClick={saveEdit}
                      aria-label="Save changes"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      className="h-7 w-7 p-0 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={cancelEdit}
                      aria-label="Cancel edit"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button className="w-full text-left p-3 flex items-center gap-2" onClick={() => onSelect(c.id)}>
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate text-sm cursor-default">
                          {truncateTitle(c.title)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs break-words">{c.title}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="text-xs text-muted-foreground truncate mt-1">{c.model}</div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                    <button
                      className="h-7 w-7 p-0 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(c.id, c.title);
                      }}
                      aria-label="Edit conversation name"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      className="h-7 w-7 p-0 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
                      }}
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
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
