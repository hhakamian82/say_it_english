import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Copy, CheckCircle, ArrowRight, Coins, GraduationCap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiBinance } from "react-icons/si";
import { BANK_CARD, BANK_NAME, CARD_HOLDER, CRYPTO_WALLET, CRYPTO_NETWORK } from "@/lib/manual-payment-info";

interface ClassItem {
    id: number;
    title: string;
    description: string | null;
    level: string;
    capacity: number;
    enrolled: number;
    price: number;
    schedule: string;
}

export default function ClassEnrollPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { toast } = useToast();
    const [, navigate] = useLocation();
    const [trackingCode, setTrackingCode] = useState("");
    const [transactionHash, setTransactionHash] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");
    const [copied, setCopied] = useState(false);
    const [copiedWallet, setCopiedWallet] = useState(false);

    const { data: cls, isLoading } = useQuery<ClassItem>({
        queryKey: [`/api/classes/${id}`],
        queryFn: async () => {
            const res = await fetch("/api/classes");
            if (!res.ok) throw new Error("Failed to fetch");
            const all = await res.json();
            return all.find((c: ClassItem) => c.id === parseInt(id!));
        },
        enabled: !!id,
    });

    const { data: paymentConfig } = useQuery<{ onlineClassPaymentEnabled: boolean }>({
        queryKey: ["/api/payment/config"],
        queryFn: async () => {
            const res = await fetch("/api/payment/config");
            if (!res.ok) return { onlineClassPaymentEnabled: false };
            return res.json();
        },
    });

    const submitPayment = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    classId: parseInt(id!),
                    paymentMethod,
                    trackingCode: paymentMethod === "card" ? trackingCode : null,
                    transactionHash: paymentMethod === "crypto" ? transactionHash : null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to submit payment");
            return data;
        },
        onSuccess: () => {
            toast({
                title: "درخواست ثبت‌نام ثبت شد ✅",
                description: "پس از تأیید ادمین، کلاس در داشبورد شما فعال خواهد شد.",
            });
            navigate("/classes");
        },
        onError: (err: Error) => {
            toast({ title: "خطا در ثبت درخواست ❌", description: err.message, variant: "destructive" });
        },
    });

    const onlinePayment = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/payment/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classId: parseInt(id!) }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to start payment");
            return data as { url: string };
        },
        onSuccess: (data) => {
            window.location.href = data.url;
        },
        onError: (err: Error) => {
            toast({ title: "خطا در اتصال به درگاه ❌", description: err.message, variant: "destructive" });
        },
    });

    const copyCardNumber = () => {
        navigator.clipboard.writeText(BANK_CARD.replace(/-/g, ""));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "شماره کارت کپی شد 📋" });
    };

    const copyWalletAddress = () => {
        navigator.clipboard.writeText(CRYPTO_WALLET);
        setCopiedWallet(true);
        setTimeout(() => setCopiedWallet(false), 2000);
        toast({ title: "آدرس ولت کپی شد 📋" });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">برای ثبت‌نام کلاس ابتدا وارد شوید</h1>
                <Button onClick={() => navigate("/auth")}>ورود / ثبت‌نام</Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!cls) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold">کلاس یافت نشد</h1>
            </div>
        );
    }

    const isFull = cls.enrolled >= cls.capacity;

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <Button variant="ghost" onClick={() => navigate("/classes")} className="mb-6">
                <ArrowRight className="ml-2 h-4 w-4" />
                بازگشت به کلاس‌های گروهی
            </Button>

            <Card className="shadow-xl">
                <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-xl">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">ثبت‌نام کلاس گروهی</CardTitle>
                    <CardDescription className="text-lg font-medium text-foreground">
                        {cls.title}
                    </CardDescription>
                    <CardDescription>{cls.schedule}</CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {isFull ? (
                        <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200 text-red-700 font-bold">
                            ظرفیت این کلاس تکمیل شده است.
                        </div>
                    ) : (
                        <>
                            {/* Price */}
                            <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <p className="text-sm text-amber-700 mb-1">شهریه قابل پرداخت:</p>
                                <p className="text-3xl font-bold text-amber-800">
                                    {formatPrice(cls.price)}
                                </p>
                            </div>

                            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted rounded-xl p-1">
                                    <TabsTrigger value="card" className="rounded-lg gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        کارت به کارت
                                    </TabsTrigger>
                                    <TabsTrigger value="crypto" className="rounded-lg gap-2">
                                        <Coins className="h-4 w-4" />
                                        رمز ارز
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="card" className="space-y-6">
                                    <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            اطلاعات کارت بانکی
                                        </h3>

                                        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                            <div>
                                                <p className="text-sm text-muted-foreground">شماره کارت</p>
                                                <p className="text-xl font-mono font-bold tracking-wider text-foreground" dir="ltr">{BANK_CARD}</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={copyCardNumber}>
                                                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="p-3 bg-card rounded-lg border">
                                                <p className="text-muted-foreground">نام بانک</p>
                                                <p className="font-medium text-foreground">{BANK_NAME}</p>
                                            </div>
                                            <div className="p-3 bg-card rounded-lg border">
                                                <p className="text-muted-foreground">نام صاحب حساب</p>
                                                <p className="font-medium text-foreground">{CARD_HOLDER}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="trackingCode" className="text-base font-medium">
                                            کد رهگیری / پیگیری بانکی
                                        </Label>
                                        <Input
                                            id="trackingCode"
                                            placeholder="کد رهگیری را وارد کنید..."
                                            value={trackingCode}
                                            onChange={(e) => setTrackingCode(e.target.value)}
                                            className="text-lg py-6"
                                            dir="ltr"
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="crypto" className="space-y-6">
                                    <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <SiBinance className="h-5 w-5 text-yellow-500" />
                                            پرداخت USDT (شبکه BEP20)
                                        </h3>

                                        <div className="p-3 bg-card rounded-lg border">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm text-muted-foreground">آدرس ولت (BEP20)</p>
                                                <Button variant="outline" size="sm" onClick={copyWalletAddress}>
                                                    {copiedWallet ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <p className="text-xs font-mono break-all font-bold tracking-tight bg-muted p-2 rounded text-foreground" dir="ltr">
                                                {CRYPTO_WALLET}
                                            </p>
                                        </div>

                                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-800 italic text-xs text-blue-700 dark:text-blue-300">
                                            ⚠️ لطفا فقط USDT روی شبکه {CRYPTO_NETWORK} ارسال کنید. ارسال روی سایر شبکه‌ها موجب از دست رفتن دارایی می‌شود.
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="transactionHash" className="text-base font-medium">
                                            هش تراکنش (Transaction Hash / TxID)
                                        </Label>
                                        <Input
                                            id="transactionHash"
                                            placeholder="0x..."
                                            value={transactionHash}
                                            onChange={(e) => setTransactionHash(e.target.value)}
                                            className="text-lg py-6"
                                            dir="ltr"
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {/* Instructions */}
                            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm space-y-2">
                                <p className="font-semibold">راهنمای پرداخت:</p>
                                <ol className="list-decimal list-inside space-y-1 mr-2">
                                    <li>مبلغ فوق را به شماره کارت بالا واریز کنید.</li>
                                    <li>کد رهگیری (پیگیری) را از رسید بانکی کپی کنید.</li>
                                    <li>کد رهگیری را در کادر بالا وارد و ثبت کنید.</li>
                                    <li>پس از تأیید توسط ادمین، لینک جلسه در داشبورد شما فعال می‌شود.</li>
                                </ol>
                            </div>

                            {/* Submit Button */}
                            <Button
                                className="w-full py-6 text-lg"
                                disabled={
                                    (paymentMethod === "card" ? !trackingCode.trim() : !transactionHash.trim()) ||
                                    submitPayment.isPending
                                }
                                onClick={() => submitPayment.mutate()}
                            >
                                {submitPayment.isPending ? (
                                    <>
                                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                                        در حال ثبت...
                                    </>
                                ) : (
                                    "ثبت درخواست پرداخت"
                                )}
                            </Button>

                            {/* Online gateway - flag-gated */}
                            {paymentConfig?.onlineClassPaymentEnabled ? (
                                <Button
                                    variant="outline"
                                    className="w-full py-6 text-lg"
                                    disabled={onlinePayment.isPending}
                                    onClick={() => onlinePayment.mutate()}
                                >
                                    {onlinePayment.isPending ? (
                                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                                    ) : (
                                        "پرداخت آنلاین (زرین‌پال)"
                                    )}
                                </Button>
                            ) : (
                                <Button variant="outline" className="w-full py-6 text-lg" disabled>
                                    پرداخت آنلاین (به‌زودی)
                                </Button>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
