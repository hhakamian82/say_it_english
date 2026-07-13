import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Instagram, Loader2, Sparkles, Check, Trash2, Save } from "lucide-react";

// پنل خصوصی تک‌کاربره (HITL): پیام/کامنت اینستاگرام را paste کن، پیش‌نویس بگیر،
// ویرایش کن و خودت در اینستاگرام بفرست. احراز واقعی سمت سرور با IG_DRAFT_TOKEN است؛
// این صفحه فقط token را یک‌بار می‌گیرد و در localStorage نگه می‌دارد (هرگز در URL).
const TOKEN_KEY = "ig_draft_token";

export default function IgDraft() {
  const { toast } = useToast();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [inbound, setInbound] = useState("");
  const [context, setContext] = useState<"dm" | "comment">("dm");
  const [draft, setDraft] = useState("");
  const [draftId, setDraftId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);

  function saveToken(value: string) {
    setToken(value);
    localStorage.setItem(TOKEN_KEY, value);
  }

  async function makeDraft() {
    if (!inbound.trim() || loading) return;
    setLoading(true);
    setDraft("");
    setDraftId(null);
    try {
      const res = await fetch("/api/ig/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inbound: inbound.trim(), context }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: res.status === 401 ? "token اشتباه است" : "خطا در تولید پیش‌نویس",
          description: data.error ?? `HTTP ${res.status}`,
          variant: "destructive",
        });
        return;
      }
      setDraft(data.draft);
      setDraftId(data.id);
    } catch {
      toast({ title: "ارتباط با سرور برقرار نشد", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function logOutcome(status: "edited" | "sent" | "discarded") {
    if (!draftId || logging) return;
    setLogging(true);
    try {
      const res = await fetch(`/api/ig/draft/${draftId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          status === "discarded"
            ? { sentStatus: status }
            : { sentStatus: status, edited: draft },
        ),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: "ثبت وضعیت ناموفق بود", description: data.error, variant: "destructive" });
        return;
      }
      toast({
        title:
          status === "sent" ? "ثبت شد: ارسال کردی ✅" :
          status === "edited" ? "نسخهٔ ویرایش‌شده ذخیره شد" :
          "پیش‌نویس کنار گذاشته شد",
      });
      if (status !== "edited") {
        setInbound("");
        setDraft("");
        setDraftId(null);
      }
    } catch {
      toast({ title: "ارتباط با سرور برقرار نشد", variant: "destructive" });
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 pb-20">
      <Helmet>
        <title>پیش‌نویس پاسخ اینستاگرام | Say It English</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="container mx-auto px-4 max-w-2xl space-y-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-lg mb-3">
            <Instagram className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">پیش‌نویس پاسخ اینستاگرام</h1>
          <p className="text-gray-500 text-sm">
            پیام یا کامنت را اینجا بگذار، پیش‌نویس بگیر، ویرایش کن و خودت بفرست
          </p>
        </div>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ig-token">Token دسترسی (یک‌بار وارد کن، ذخیره می‌شود)</Label>
              <Input
                id="ig-token"
                type="password"
                dir="ltr"
                value={token}
                onChange={(e) => saveToken(e.target.value)}
                placeholder="IG_DRAFT_TOKEN"
              />
            </div>

            <div className="space-y-1.5">
              <Label>نوع پیام</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={context === "dm" ? "default" : "outline"}
                  onClick={() => setContext("dm")}
                >
                  دایرکت (DM)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={context === "comment" ? "default" : "outline"}
                  onClick={() => setContext("comment")}
                >
                  کامنت
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ig-inbound">پیام دانش‌آموز</Label>
              <Textarea
                id="ig-inbound"
                value={inbound}
                onChange={(e) => setInbound(e.target.value)}
                placeholder="مثلاً: سلام، قیمت کلاس‌های گروهی چنده؟"
                rows={4}
              />
            </div>

            <Button className="w-full" onClick={makeDraft} disabled={loading || !inbound.trim() || !token}>
              {loading ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 ml-2" />
              )}
              پیش‌نویس بساز
            </Button>
          </CardContent>
        </Card>

        {draft && (
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">پیش‌نویس پاسخ (قابل ویرایش)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={7} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => logOutcome("sent")} disabled={logging}>
                  <Check className="w-4 h-4 ml-1" />
                  ارسال کردم
                </Button>
                <Button size="sm" variant="outline" onClick={() => logOutcome("edited")} disabled={logging}>
                  <Save className="w-4 h-4 ml-1" />
                  ذخیرهٔ ویرایش
                </Button>
                <Button size="sm" variant="destructive" onClick={() => logOutcome("discarded")} disabled={logging}>
                  <Trash2 className="w-4 h-4 ml-1" />
                  کنار بگذار
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                ارسال نهایی همیشه دستی و از خود اینستاگرام است — اینجا فقط نتیجه ثبت (log) می‌شود.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
