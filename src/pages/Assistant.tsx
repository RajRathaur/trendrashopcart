import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Plus, Trash2, ShoppingBag, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Thread = { id: string; title: string; last_message_at: string };

const AssistantPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { threadId } = useParams<{ threadId: string }>();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [input, setInput] = useState("");
  const initRef = useRef(false);

  // Redirect to login if not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?redirect=/assistant`, { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Load thread list
  const loadThreads = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_threads")
      .select("id,title,last_message_at")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false });
    setThreads((data ?? []) as Thread[]);
    return data ?? [];
  };

  // On first mount (or user change): ensure there is an active thread
  useEffect(() => {
    if (!user || initRef.current) return;
    initRef.current = true;
    (async () => {
      const list = (await loadThreads()) as Thread[];
      if (!threadId) {
        if (list.length > 0) {
          navigate(`/assistant/${list[0].id}`, { replace: true });
        } else {
          const { data, error } = await supabase
            .from("chat_threads")
            .insert({ user_id: user.id, title: "New chat" })
            .select("id")
            .single();
          if (error) {
            toast.error("Could not create chat");
            return;
          }
          navigate(`/assistant/${data.id}`, { replace: true });
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load messages whenever active thread changes
  useEffect(() => {
    if (!user || !threadId) return;
    setLoadingThread(true);
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("content")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      const msgs: UIMessage[] = (data ?? [])
        .map((r) => r.content as unknown as UIMessage)
        .filter((m) => !!m && Array.isArray((m as any).parts));
      setInitialMessages(msgs);
      setLoadingThread(false);
    })();
  }, [threadId, user]);

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
      prepareSendMessagesRequest: async ({ messages, id }) => {
        const { data: { session } } = await supabase.auth.getSession();
        return {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: { threadId: id, messages },
        };
      },
    });
  }, []);

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message || "Chat failed"),
    onFinish: () => loadThreads(),
  });

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = (message.text ?? input).trim();
    if (!text || !threadId) return;
    setInput("");
    await sendMessage({ text });
  };

  const newThread = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ user_id: user.id, title: "New chat" })
      .select("id")
      .single();
    if (error || !data) return toast.error("Could not create chat");
    await loadThreads();
    navigate(`/assistant/${data.id}`);
  };

  const deleteThread = async (id: string) => {
    if (!confirm("Delete this chat?")) return;
    await supabase.from("chat_threads").delete().eq("id", id);
    const remaining = threads.filter((t) => t.id !== id);
    setThreads(remaining);
    if (id === threadId) {
      if (remaining[0]) navigate(`/assistant/${remaining[0].id}`, { replace: true });
      else {
        initRef.current = false;
        navigate(`/assistant`, { replace: true });
      }
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <Layout hideFooter>
      <div className="container mx-auto px-0 md:px-4 py-0 md:py-4">
        <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] bg-card md:rounded-xl md:border overflow-hidden">
          {/* Thread sidebar */}
          <aside className="hidden md:flex w-64 border-r flex-col">
            <div className="p-3 border-b">
              <Button onClick={newThread} className="w-full gap-2" size="sm">
                <Plus className="h-4 w-4" /> New chat
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <ul className="p-2 space-y-1">
                {threads.map((t) => (
                  <li
                    key={t.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-md text-sm",
                      t.id === threadId ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/assistant/${t.id}`)}
                      className="flex-1 text-left px-2 py-2 truncate"
                    >
                      {t.title || "New chat"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteThread(t.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </aside>

          {/* Chat panel */}
          <section className="flex-1 flex flex-col min-w-0">
            <header className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Trendra Assistant</p>
                  <p className="text-xs text-muted-foreground">AI shopping helper</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={newThread}
                className="md:hidden gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> New
              </Button>
            </header>

            <Conversation key={threadId}>
              <ConversationContent>
                {loadingThread ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <ConversationEmptyState
                    icon={<MessageSquare className="h-8 w-8 text-primary" />}
                    title="Aapko kya chahiye?"
                    description="Try: 'Show me running shoes under 2000' or 'Best smartphone under 15000'"
                  />
                ) : (
                  messages.map((m) => {
                    const text = m.parts
                      .map((p: any) => (p.type === "text" ? p.text : ""))
                      .join("");
                    return (
                      <Message from={m.role} key={m.id}>
                        <MessageContent>
                          {m.role === "assistant" ? (
                            <MessageResponse>{text || ""}</MessageResponse>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{text}</p>
                          )}
                        </MessageContent>
                      </Message>
                    );
                  })
                )}
                {status === "submitted" && (
                  <Message from="assistant">
                    <MessageContent>
                      <Shimmer>Thinking…</Shimmer>
                    </MessageContent>
                  </Message>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            <div className="border-t p-3">
              <PromptInput onSubmit={handleSubmit}>
                <PromptInputBody>
                  <PromptInputTextarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Trendra anything… 'Find a saree under 1500'"
                    autoFocus
                  />
                  <PromptInputFooter className="justify-end">
                    <PromptInputSubmit
                      status={status}
                      disabled={!input.trim() && !isBusy}
                    />
                  </PromptInputFooter>
                </PromptInputBody>
              </PromptInput>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Powered by Lovable AI · Need a human? <Link to="/contact" className="underline">Contact us</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default AssistantPage;
