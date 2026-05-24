import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
    Mic, MicOff, Play, CheckCircle2, AlertTriangle, Lightbulb, Sparkles,
    Volume2, RefreshCw, Star, ArrowRight, Award, HelpCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Phrase {
    phrase: string;
    meaning: string;
}

interface Vocabulary {
    word: string;
    meaning: string;
}

interface SpeakingBuddyProps {
    phrases?: Phrase[];
    vocabulary?: Vocabulary[];
    level?: string;
}

interface AISpeakingFeedback {
    overallScore: number;
    pronunciation: {
        score: number;
        issues: string[];
        tips: string[];
    };
    grammar: {
        score: number;
        corrections: { original: string; corrected: string; explanation: string }[];
    };
    vocabulary: {
        goodWords: string[];
        suggestions: { replace: string; with: string }[];
    };
    encouragement: string;
    nativeSuggestion: string;
    xpEarned?: number;
}

export function SpeakingBuddy({
    phrases = [],
    vocabulary = [],
    level = "intermediate",
}: SpeakingBuddyProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    
    // Select default target phrase
    const allPracticeItems = [
        ...phrases.map(p => ({ text: p.phrase, translation: p.meaning, type: "phrase" })),
        ...vocabulary.map(v => ({ text: v.word, translation: v.meaning, type: "vocab" }))
    ];

    const [selectedItem, setSelectedItem] = useState<{ text: string; translation: string; type: string } | null>(
        allPracticeItems.length > 0 ? allPracticeItems[0] : null
    );

    const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle");
    const [transcription, setTranscription] = useState("");
    const [feedback, setFeedback] = useState<AISpeakingFeedback | null>(null);
    const [recognitionError, setRecognitionError] = useState("");
    
    const recognitionRef = useRef<any>(null);

    // Audio text-to-speech helper (letting user listen to the target phrase)
    const speakTarget = (text: string) => {
        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.85; // slightly slower for learners
        window.speechSynthesis.speak(utterance);
    };

    // Initialize Web Speech API Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setRecognitionError("مرورگر شما از قابلیت تشخیص گفتار پشتیبانی نمی‌کند. از کروم یا سافاری استفاده کنید.");
            return;
        }

        const rec = new SpeechRecognition();
        rec.lang = "en-US";
        rec.continuous = false;
        rec.interimResults = false;

        rec.onstart = () => {
            setStatus("listening");
            setTranscription("");
        };

        rec.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error);
            let message = "خطا در تشخیص صدا. لطفاً دسترسی میکروفون را بررسی کنید.";
            if (event.error === "no-speech") message = "صدایی شنیده نشد. دوباره امتحان کنید.";
            if (event.error === "not-allowed") message = "اجازه دسترسی به میکروفون داده نشده است.";
            
            toast({ title: "خطای میکروفون", description: message, variant: "destructive" });
            setStatus("idle");
        };

        rec.onend = () => {
            // Only set idle if we didn't succeed to transition to processing
            setStatus(current => current === "listening" ? "idle" : current);
        };

        rec.onresult = (event: any) => {
            const resultText = event.results[0][0].transcript;
            setTranscription(resultText);
            analyzeSpeech(resultText);
        };

        recognitionRef.current = rec;
    }, [selectedItem, toast]);

    const startRecording = () => {
        if (!recognitionRef.current) {
            toast({
                title: "عدم پشتیبانی",
                description: "مرورگر شما از ضبط صدا پشتیبانی نمی‌کند. لطفاً از گوگل کروم استفاده کنید.",
                variant: "destructive"
            });
            return;
        }
        
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error(e);
            recognitionRef.current.stop();
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    const analyzeSpeech = async (text: string) => {
        setStatus("processing");
        try {
            const res = await fetch("/api/ai/speaking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcribedText: text,
                    targetPhrase: selectedItem?.text,
                    level,
                }),
            });

            if (!res.ok) {
                throw new Error("تحلیل صدا توسط هوش مصنوعی با خطا مواجه شد.");
            }

            const data = await res.json();
            setFeedback(data);
            setStatus("success");
            toast({ title: "تحلیل با موفقیت انجام شد! 🎙️", description: "گزارش هوش مصنوعی آماده است." });
        } catch (err: any) {
            console.error(err);
            toast({ title: "خطا در تحلیل", description: err.message, variant: "destructive" });
            setStatus("idle");
        }
    };

    const resetBuddy = () => {
        setStatus("idle");
        setTranscription("");
        setFeedback(null);
    };

    return (
        <div className="space-y-6 dir-rtl text-right">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-violet-700 dark:text-violet-400">
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                        دستیار هوش مصنوعی تصحیح گفتار (AI Speaking Buddy)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        جمله انگلیسی را تلفظ کنید، تلفظ و گرامر شما توسط هوش مصنوعی تحلیل و امتیازدهی می‌شود.
                    </p>
                </div>
                {user?.xp !== undefined && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-bold">
                        <Award className="w-4 h-4" />
                        <span>{user.xp} XP</span>
                    </div>
                )}
            </div>

            {recognitionError ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    {recognitionError}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Phrases list sidebar */}
                    {allPracticeItems.length > 0 && (
                        <div className="lg:col-span-1 bg-muted/20 border rounded-2xl p-4 space-y-3 max-h-[450px] overflow-y-auto">
                            <h4 className="font-bold text-sm text-foreground/80 mb-2 px-1">جملات و لغات پیشنهادی برای تمرین:</h4>
                            <div className="space-y-2">
                                {allPracticeItems.map((item, idx) => {
                                    const isSelected = selectedItem?.text === item.text;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setSelectedItem(item);
                                                resetBuddy();
                                            }}
                                            className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 ${
                                                isSelected
                                                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-transparent shadow-md"
                                                    : "bg-card hover:bg-muted/80 text-foreground border-border/80"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center w-full" dir="ltr">
                                                <span className="font-bold text-sm tracking-wide line-clamp-1">{item.text}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                                                    isSelected 
                                                        ? "bg-white/20 text-white" 
                                                        : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                                                }`}>
                                                    {item.type === "vocab" ? "لغت" : "جمله"}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] w-full text-right ${isSelected ? "text-white/80" : "text-muted-foreground"}`} dir="rtl">
                                                {item.translation}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recording Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Target Phrase Box */}
                        {selectedItem && (
                            <div className="bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 dark:from-violet-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border border-indigo-100/80 dark:border-indigo-900/40 p-6 rounded-2xl relative shadow-sm">
                                <span className="absolute -top-3 right-5 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                                    جمله هدف برای بیان
                                </span>
                                
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                                    <div className="space-y-2 text-left" dir="ltr">
                                        <h4 className="text-2xl font-black text-indigo-950 dark:text-indigo-200 tracking-tight leading-tight">
                                            {selectedItem.text}
                                        </h4>
                                        <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 font-medium" dir="rtl">
                                            معنی: {selectedItem.translation}
                                        </p>
                                    </div>
                                    
                                    <Button
                                        onClick={() => speakTarget(selectedItem.text)}
                                        className="rounded-full bg-white dark:bg-slate-900 border text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200 border-indigo-200 hover:border-indigo-300 shadow-sm flex items-center justify-center h-12 w-12 flex-shrink-0"
                                        title="شنیدن تلفظ صحیح"
                                    >
                                        <Volume2 className="w-5 h-5 animate-pulse" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Interactive Recorder Control Panel */}
                        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center gap-6 min-h-[220px]">
                            {status === "idle" && (
                                <div className="text-center space-y-4">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                                        <Button
                                            onClick={startRecording}
                                            className="relative rounded-full h-20 w-20 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:scale-105 hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center justify-center"
                                        >
                                            <Mic className="w-8 h-8" />
                                        </Button>
                                    </div>
                                    <p className="text-sm font-bold text-foreground/80">برای شروع صحبت، دکمه میکروفون را بزنید</p>
                                    <p className="text-xs text-muted-foreground">صدا به صورت خودکار متوقف و تحلیل می‌شود</p>
                                </div>
                            )}

                            {status === "listening" && (
                                <div className="text-center space-y-4 w-full flex flex-col items-center">
                                    <div className="relative flex items-center justify-center">
                                        <motion.div
                                            animate={{ scale: [1, 1.4, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="absolute w-24 h-24 bg-red-500/10 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                                            className="absolute w-20 h-20 bg-red-500/20 rounded-full"
                                        />
                                        <Button
                                            onClick={stopRecording}
                                            className="relative rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center"
                                        >
                                            <MicOff className="w-6 h-6 animate-pulse" />
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-red-500 animate-pulse">در حال شنیدن صدای شما...</p>
                                        <p className="text-xs text-muted-foreground">با آرامش انگلیسی صحبت کنید</p>
                                    </div>

                                    {/* Microphone dynamic soundwave animation */}
                                    <div className="flex gap-1 items-center justify-center h-8 mt-2">
                                        {[...Array(6)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: [8, Math.random() * 24 + 8, 8] }}
                                                transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                                                className="w-1 bg-gradient-to-t from-red-400 to-rose-600 rounded-full"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {status === "processing" && (
                                <div className="text-center space-y-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-indigo-700 animate-pulse">در حال پردازش گفتار و تحلیل با هوش مصنوعی...</p>
                                        {transcription && (
                                            <p className="text-xs text-muted-foreground italic" dir="ltr">
                                                "{transcription}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {status === "success" && feedback && (
                                <div className="w-full space-y-6">
                                    {/* Overall Score Banner */}
                                    <div className="bg-gradient-to-br from-indigo-900 to-violet-950 text-white p-6 rounded-3xl relative overflow-hidden shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl" />
                                        
                                        <div className="text-right space-y-2 relative z-10">
                                            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                گزارش نهایی آنالیز
                                            </span>
                                            <h4 className="text-xl font-black">آفرین! تلاش عالی بود 💫</h4>
                                            <p className="text-indigo-200/90 text-sm leading-relaxed max-w-md">
                                                {feedback.encouragement}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 flex-shrink-0 relative z-10">
                                            <div className="flex flex-col items-center">
                                                <div className="relative flex items-center justify-center">
                                                    {/* Radial Score Indicator */}
                                                    <svg className="w-24 h-24 transform -rotate-90">
                                                        <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="transparent" />
                                                        <circle
                                                            cx="48"
                                                            cy="48"
                                                            r="40"
                                                            stroke="url(#gradientScore)"
                                                            strokeWidth="8"
                                                            fill="transparent"
                                                            strokeDasharray={251.2}
                                                            strokeDashoffset={251.2 - (251.2 * feedback.overallScore) / 100}
                                                            strokeLinecap="round"
                                                        />
                                                        <defs>
                                                            <linearGradient id="gradientScore" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#8b5cf6" />
                                                                <stop offset="100%" stopColor="#3b82f6" />
                                                            </linearGradient>
                                                        </defs>
                                                    </svg>
                                                    <span className="absolute font-black text-3xl text-white tracking-tighter">
                                                        {feedback.overallScore}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-indigo-300 font-bold mt-1.5 uppercase">امتیاز کل</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Reports Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Pronunciation Card */}
                                        <Card className="rounded-2xl border/80 shadow-sm overflow-hidden hover:border-violet-300/40 transition-colors">
                                            <div className="bg-violet-50/50 dark:bg-violet-950/20 px-4 py-3 border-b flex justify-between items-center">
                                                <span className="font-bold text-sm text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                                                    <Volume2 className="w-4 h-4" />
                                                    تلفظ و لهجه
                                                </span>
                                                <Badge className="bg-violet-600 hover:bg-violet-600 text-white font-bold">{feedback.pronunciation.score}/100</Badge>
                                            </div>
                                            <CardContent className="p-4 space-y-3">
                                                {feedback.pronunciation.issues.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        <span className="text-[11px] text-muted-foreground block font-bold">ایرادات تلفظی:</span>
                                                        {feedback.pronunciation.issues.map((issue, idx) => (
                                                            <div key={idx} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                                                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                                <span>{issue}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                                        <span>تلفظ بسیار خوب و روان، بدون مشکل عمده!</span>
                                                    </div>
                                                )}
                                                
                                                {feedback.pronunciation.tips.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        <span className="text-[11px] text-muted-foreground block font-bold">راهنمای بهبود تلفظ:</span>
                                                        {feedback.pronunciation.tips.map((tip, idx) => (
                                                            <div key={idx} className="flex items-start gap-2 text-xs text-foreground/80 bg-muted/40 p-2 rounded-lg">
                                                                <Lightbulb className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                                                                <span>{tip}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Grammar Card */}
                                        <Card className="rounded-2xl border/80 shadow-sm overflow-hidden hover:border-indigo-300/40 transition-colors">
                                            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3 border-b flex justify-between items-center">
                                                <span className="font-bold text-sm text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                                                    <Star className="w-4 h-4 text-indigo-500" />
                                                    ساختار و گرامر
                                                </span>
                                                <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white font-bold">{feedback.grammar.score}/100</Badge>
                                            </div>
                                            <CardContent className="p-4 space-y-3">
                                                {feedback.grammar.corrections.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <span className="text-[11px] text-muted-foreground block font-bold">اصلاحات گرامری:</span>
                                                        {feedback.grammar.corrections.map((corr, idx) => (
                                                            <div key={idx} className="space-y-1.5 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3 bg-indigo-500/5">
                                                                <div className="flex flex-col gap-1 text-left" dir="ltr">
                                                                    <span className="text-xs text-red-500 line-through font-mono">You said: {corr.original}</span>
                                                                    <span className="text-xs text-green-600 font-bold font-mono">Corrected: {corr.corrected}</span>
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground/90 mt-1 border-t pt-1" dir="rtl">
                                                                    💡 {corr.explanation}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                                        <span>ساختار جمله‌بندی و گرامر کاملاً صحیح است.</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Native Suggestion & Good Vocab */}
                                    <div className="bg-muted/30 border rounded-2xl p-5 space-y-4">
                                        <div className="space-y-1 text-left" dir="ltr">
                                            <span className="text-[10px] text-violet-700 dark:text-violet-300 font-bold bg-violet-100 dark:bg-violet-950 px-2.5 py-0.5 rounded-full" dir="rtl">
                                                🗣️ بیان بومی‌تر (Native Style)
                                            </span>
                                            <p className="text-base font-bold text-foreground mt-2 leading-relaxed">
                                                "{feedback.nativeSuggestion}"
                                            </p>
                                        </div>

                                        {feedback.vocabulary.goodWords.length > 0 && (
                                            <div className="space-y-1.5 border-t pt-3">
                                                <span className="text-[11px] text-muted-foreground font-bold">کلمات و اصطلاحات عالی استفاده شده:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {feedback.vocabulary.goodWords.map((word, i) => (
                                                        <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs px-2.5 py-0.5 rounded-lg" dir="ltr">
                                                            {word}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Practice again button */}
                                    <div className="flex items-center justify-end gap-2 pt-2">
                                        <Button
                                            onClick={resetBuddy}
                                            variant="outline"
                                            className="rounded-xl px-5 h-11 text-xs gap-1.5"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            تمرین مجدد
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
