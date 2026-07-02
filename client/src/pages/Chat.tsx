import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "سلام! من دستیار پشتیبانی Say It English هستم. چطور می‌تونم کمکت کنم؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || isSending) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "خطا در ارتباط با چت");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: err.message || "پاسخ دریافت نشد. دوباره تلاش کنید.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 pb-20">
      <Helmet>
        <title>چت پشتیبانی | Say It English</title>
      </Helmet>
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-cyan-600 rounded-full shadow-lg mb-3">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">چت با دستیار هوشمند</h1>
          <p className="text-gray-500 text-sm">پاسخ سوالات شما دربارهٔ سایت و دوره‌ها</p>
        </div>

        <Card className="rounded-2xl border-none shadow-sm overflow-hidden flex flex-col h-[60vh]">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    dir="auto"
                    style={{ unicodeBidi: "plaintext" }}
                    className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-6 ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-gray-100 text-gray-800 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isSending && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-gray-100 text-gray-400 flex items-center gap-2 text-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    در حال نوشتن...
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-3 flex items-end gap-2 bg-white">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="سوال خودت رو بنویس..."
              rows={1}
              className="resize-none rounded-xl min-h-[44px] max-h-32"
              disabled={isSending}
            />
            <Button
              onClick={sendMessage}
              disabled={isSending || !input.trim()}
              size="icon"
              className="rounded-xl h-11 w-11 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
