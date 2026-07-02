import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Loader2 } from "lucide-react";
import { useChat } from "@/hooks/use-chat";

export function ChatConversation() {
  const { messages, input, setInput, isSending, sendMessage, handleKeyDown, scrollRef } = useChat();

  return (
    <>
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
    </>
  );
}
