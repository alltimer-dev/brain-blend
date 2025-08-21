import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelPicker, MODEL_OPTIONS } from "@/components/chat/ModelPicker";
import { SidebarConversations, type Conversation } from "@/components/chat/SidebarConversations";
import { LogOut, Menu } from "lucide-react";
import { type LogEntry } from "@/components/chat/LogModal";

export type Message = { id?: string; role: "user" | "assistant" | "system"; content: string; created_at?: string; model?: string; log?: LogEntry };

const Index = () => {
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState(MODEL_OPTIONS[1].id); // default GPT-4
  const [sending, setSending] = useState(false);

  // Auth init
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setSessionChecked(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setSessionChecked(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!userId) {
      navigate("/auth");
      return;
    }
    // Load conversations
    (async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id,title,model,updated_at")
        .order("updated_at", { ascending: false });
      if (error) {
        toast({ title: "Failed to load conversations", description: error.message });
        return;
      }
      setConversations(data || []);
      if (data && data.length > 0 && !activeId) setActiveId(data[0].id);
    })();
  }, [sessionChecked, userId]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      if (error) {
        toast({ title: "Failed to load messages", description: error.message });
        return;
      }
      setMessages((data ?? []) as Message[]);
      const conv = conversations.find((c) => c.id === activeId);
      if (conv) setModel(conv.model);
    })();
  }, [activeId]);

  const handleNewChat = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title: "New chat", model })
      .select("id,title,model,updated_at")
      .single();
    if (error) {
      toast({ title: "Failed to create chat", description: error.message });
      return;
    }
    setConversations((prev) => [data as Conversation, ...prev]);
    setActiveId(data.id);
    setMessages([]);
  };

  const handleDeleteChat = async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete chat", description: error.message });
      return;
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  const ensureConversation = async (firstMessage?: string) => {
    if (activeId && conversations.find((c) => c.id === activeId)) return activeId;
    if (!userId) return null;
    const title = firstMessage ? firstMessage.slice(0, 60) : "New chat";
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title, model })
      .select("id,title,model,updated_at")
      .single();
    if (error) {
      toast({ title: "Failed to create chat", description: error.message });
      return null;
    }
    setConversations((prev) => [data as Conversation, ...prev]);
    setActiveId(data.id);
    return data.id as string;
  };

  const sendMessage = async (text: string) => {
    if (!userId) return;
    setSending(true);
    const startTime = Date.now();
    
    try {
      const convId = await ensureConversation(text);
      if (!convId) return;

      const userMsg: Message = { role: "user", content: text };
      const { data: insertedUser, error: insertUserErr } = await supabase
        .from("messages")
        .insert({ conversation_id: convId, role: "user", content: text })
        .select("id, role, content, created_at")
        .single();
      if (insertUserErr) throw insertUserErr;
      setMessages((prev) => [...prev, insertedUser as Message]);

      // Build context for model
      const ctx = [...(messages || []), userMsg]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const { data: fnRes, error: fnErr } = await supabase.functions.invoke("ai-proxy", {
        body: { model, messages: ctx },
      });
      
      const responseTime = Date.now() - startTime;
      
      if (fnErr) {
        // Create error log
        const errorLog: LogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          model,
          success: false,
          error: fnErr.message,
          responseTime,
          requestContent: text,
          responseContent: "",
        };
        
        throw fnErr;
      }

      const aiText = (fnRes as any)?.generatedText as string;
      if (!aiText) {
        const errorLog: LogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          model,
          success: false,
          error: "AI response empty. Configure API keys?",
          responseTime,
          requestContent: text,
          responseContent: "",
        };
        
        throw new Error("AI response empty. Configure API keys?");
      }

      // Create success log
      const successLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        model: (fnRes as any)?.model || model,
        success: true,
        responseTime,
        requestContent: text,
        responseContent: aiText,
        tokensUsed: (fnRes as any)?.usage?.total_tokens || undefined,
      };

      const { data: insertedAI, error: insertAiErr } = await supabase
        .from("messages")
        .insert({ conversation_id: convId, role: "assistant", content: aiText })
        .select("id, role, content, created_at")
        .single();
      if (insertAiErr) throw insertAiErr;

      setMessages((prev) => [...prev, { ...insertedAI, model, log: successLog } as Message]);

      // Refresh conversations order
      const { data: convs } = await supabase
        .from("conversations")
        .select("id,title,model,updated_at")
        .order("updated_at", { ascending: false });
      if (convs) setConversations(convs as any);
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const activeMessages = useMemo(() => messages, [messages]);

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/70 backdrop-blur border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Multi‑Model AI Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            <ModelPicker value={model} onChange={setModel} />
            <Button variant="secondary" onClick={handleNewChat}>New chat</Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside className={`
          fixed top-14 left-0 z-10 h-[calc(100vh-56px)] bg-background border-r 
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          w-80
        `}>
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <SidebarConversations
                items={conversations}
                activeId={activeId}
                onSelect={(id) => setActiveId(id)}
                onDelete={handleDeleteChat}
                onNew={handleNewChat}
              />
            </div>
            <div className="p-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="w-full"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main chat */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-80" : "ml-0"}`}>
          {/* Overlay when sidebar is open */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/20 z-5" 
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          <section className="flex-1 p-4 md:p-6">
            <div className="mx-auto max-w-4xl">
              {activeMessages.length === 0 ? (
                <div className="text-center text-muted-foreground border rounded-lg p-8">
                  Start a conversation with {MODEL_OPTIONS.find((m) => m.id === model)?.label}.
                </div>
              ) : (
                <div className="space-y-1">
                  {activeMessages.map((m) => <ChatMessage key={m.id + m.created_at} role={m.role} content={m.content} model={m.model} log={m.log} />)}
                </div>
              )}
            </div>
          </section>
          <Separator />
          <section className="p-4 md:p-6">
            <div className="mx-auto max-w-4xl">
              <ChatInput onSend={sendMessage} disabled={sending} />
              <p className="mt-2 text-xs text-muted-foreground">Messages may be used to improve model quality. Do not share sensitive info.</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
