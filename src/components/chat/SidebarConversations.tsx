import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, MessageSquare } from "lucide-react";

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
  onNew,
}: {
  items: Conversation[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
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
            <li key={c.id} className={"group rounded-md border hover:bg-muted/60 " + (activeId === c.id ? "bg-muted" : "bg-background")}>
              <button className="w-full text-left p-3 flex items-center gap-2" onClick={() => onSelect(c.id)}>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm">{c.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.model}</div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-destructive hover:underline text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
