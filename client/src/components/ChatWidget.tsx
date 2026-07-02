import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, X } from "lucide-react";
import { ChatConversation } from "@/components/ChatConversation";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50 md:bottom-6 md:left-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 left-0 w-[calc(100vw-2rem)] max-w-sm"
          >
            <Card className="rounded-2xl border-none shadow-2xl overflow-hidden flex flex-col h-[28rem]">
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-cyan-600 text-white shrink-0">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  <span className="font-bold text-sm">دستیار هوشمند Say It English</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="بستن چت"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ChatConversation />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen((v) => !v)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-cyan-600 hover:opacity-90"
        aria-label={isOpen ? "بستن چت" : "باز کردن چت پشتیبانی"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isOpen ? "close" : "open"}
            initial={{ rotate: -45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 45, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
          </motion.div>
        </AnimatePresence>
      </Button>
    </div>
  );
}
