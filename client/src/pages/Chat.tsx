import { Card } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { ChatConversation } from "@/components/ChatConversation";

export default function Chat() {
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
          <ChatConversation />
        </Card>
      </div>
    </div>
  );
}
