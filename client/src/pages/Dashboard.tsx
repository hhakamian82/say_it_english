import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Flame,
    Trophy,
    Clock,
    PlayCircle,
    BookOpen,
    Target,
    ChevronLeft,
    Settings,
    LogOut,
    Zap,
    Star,
    Award,
    GraduationCap,
    Video,
} from "lucide-react";
import { api } from "@shared/routes";
import { useContent } from "@/hooks/use-content";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const { data: content, isLoading: contentLoading } = useContent();

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get("payment") === "success") {
            const plan = searchParams.get("plan");
            toast({
                title: "پرداخت موفقیت‌آمیز بود! 🎉",
                description: `اشتراک ${plan === 'gold' ? 'طلایی' : plan === 'silver' ? 'نقره‌ای' : 'برنزی'} شما فعال شد.`,
                duration: 5000,
                className: "bg-green-500 text-white border-green-600",
            });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        const enrollment = searchParams.get("enrollment");
        if (enrollment === "success") {
            toast({
                title: "ثبت‌نام موفقیت‌آمیز بود! 🎉",
                description: "کلاس شما فعال شد. لینک جلسه در بخش «کلاس‌های من» در دسترس است.",
                duration: 5000,
                className: "bg-green-500 text-white border-green-600",
            });
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (enrollment === "full") {
            toast({
                title: "ظرفیت کلاس تکمیل شد",
                description: "پرداخت شما موفق بود اما ظرفیت پیش از تایید تکمیل شد. پشتیبانی با شما تماس می‌گیرد.",
                variant: "destructive",
                duration: 8000,
            });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [toast]);

    const { data: myClasses } = useQuery<any[]>({
        queryKey: ["/api/my-classes"],
        queryFn: async () => {
            const res = await fetch("/api/my-classes", { credentials: "include" });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!user,
    });

    // Fetch user stats from new Phase 2 endpoint
    const { data: stats } = useQuery<any>({
        queryKey: ["/api/user/stats"],
        queryFn: async () => {
            const res = await fetch("/api/user/stats", { credentials: "include" });
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!user,
    });

    // Fetch badges data
    const { data: badgesData } = useQuery<any>({
        queryKey: ["/api/badges"],
        queryFn: async () => {
            const res = await fetch("/api/badges", { credentials: "include" });
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!user,
    });

    // Use first 3 items as "Continue Watching" fallback
    const recentActivities = content?.slice(0, 3) || [];

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Link href="/auth">
                    <Button size="lg" className="rounded-2xl">لطفاً ابتدا وارد شوید</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-8 pb-20">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary shadow-lg">
                            <AvatarImage src={user.avatar || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-cyan-700 text-white text-lg font-bold px-2">
                                {user.firstName || user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                سلام، {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || user.username)}! 👋
                            </h1>
                            <p className="text-gray-500">خوش آمدید، بیایید یادگیری را ادامه دهیم.</p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Link href="/profile">
                            <Button variant="outline" className="rounded-xl gap-2 flex-1 md:flex-none">
                                <Settings className="w-4 h-4" />
                                تنظیمات
                            </Button>
                        </Link>
                        <Button variant="ghost" className="rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 flex-1 md:flex-none" onClick={() => logout()}>
                            <LogOut className="w-4 h-4" />
                            خروج
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div whileHover={{ y: -5 }} className="col-span-1">
                        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50 border-b-4 border-orange-400">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="bg-orange-500/10 p-3 rounded-full mb-3">
                                    <Flame className="w-8 h-8 text-orange-600 fill-orange-600 animate-pulse" />
                                </div>
                                <span className="text-3xl font-black text-gray-900">{stats?.streak || user.streak || 0}</span>
                                <span className="text-sm font-medium text-gray-600 mt-1">روز پشت‌سرهم</span>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="col-span-1">
                        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-amber-50 to-yellow-100/50 border-b-4 border-amber-400">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="bg-amber-500/10 p-3 rounded-full mb-3">
                                    <Zap className="w-8 h-8 text-amber-600" />
                                </div>
                                <span className="text-3xl font-black text-gray-900">{stats?.xp || 0}</span>
                                <span className="text-sm font-medium text-gray-600 mt-1">امتیاز (XP)</span>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="col-span-1">
                        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-green-50 to-green-100/50 border-b-4 border-green-400">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="bg-green-500/10 p-3 rounded-full mb-3">
                                    <Target className="w-8 h-8 text-green-600" />
                                </div>
                                <span className="text-3xl font-black text-gray-900">{stats?.completedLessons || 0}</span>
                                <span className="text-sm font-medium text-gray-600 mt-1">درس کامل‌شده</span>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="col-span-1">
                        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50 border-b-4 border-purple-400">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="bg-purple-500/10 p-3 rounded-full mb-3">
                                    <BookOpen className="w-8 h-8 text-purple-600" />
                                </div>
                                <span className="text-3xl font-black text-gray-900">{stats?.savedVocabCount || 0}</span>
                                <span className="text-sm font-medium text-gray-600 mt-1">لغت ذخیره‌شده</span>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Continue Learning - Now using REAL Data */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <PlayCircle className="w-6 h-6 text-primary" />
                                    ادامه یادگیری (جدیدترین درس‌ها)
                                </h2>
                                <Link href="/videos">
                                    <Button variant="link" className="text-primary p-0 h-auto font-bold">مشاهده همه</Button>
                                </Link>
                            </div>

                            <div className="grid gap-4">
                                {contentLoading ? (
                                    <div className="bg-white p-4 h-24 rounded-2xl animate-pulse"></div>
                                ) : recentActivities.length > 0 ? (
                                    recentActivities.map((item: any, i: number) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <Link href={`/videos/${item.id}`}>
                                                <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden">
                                                    <div className="flex h-24">
                                                        <div className="w-32 bg-gray-200 relative aspect-video">
                                                            {item.thumbnailUrl ? (
                                                                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                                    <PlayCircle className="w-8 h-8 text-white opacity-80" />
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                                                                <PlayCircle className="w-8 h-8 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="font-bold text-gray-900 line-clamp-1">{item.title}</h3>
                                                                <Badge variant="outline" className="text-xs">{item.level}</Badge>
                                                            </div>

                                                            <div className="w-full flex justify-between items-center text-xs text-gray-500 mt-2">
                                                                <span>{item.type === 'video' ? 'ویدیو آموزشی' : 'مقاله'}</span>
                                                                <span className="text-primary font-bold">نمایش درس →</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Link>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 bg-white rounded-2xl">
                                        هیچ درسی یافت نشد. به زودی اضافه می‌شود!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recommended */}
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <BookOpen className="w-6 h-6 text-amber-500" />
                                پیشنهاد ویژه برای شما
                            </h2>
                            <Card className="rounded-2xl bg-gradient-to-r from-primary/90 to-primary text-white border-none shadow-lg overflow-hidden relative">
                                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-3">سطح متوسط</Badge>
                                        <h3 className="text-2xl font-black mb-2">تسلط بر اصطلاحات ۳۰۰۰ دلاری!</h3>
                                        <p className="text-primary-foreground/90 max-w-sm mb-6">
                                            در این دوره فشرده، اصطلاحات تجاری و پول‌ساز دنیای بیزنس را یاد می‌گیرید.
                                        </p>
                                        <Button variant="secondary" className="rounded-xl font-bold px-6">شروع یادگیری</Button>
                                    </div>
                                    <div className="w-32 h-32 bg-white/20 rounded-2xl rotate-3 flex items-center justify-center shadow-xl backdrop-blur-sm">
                                        <Trophy className="w-16 h-16 text-white" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* My Classes */}
                        {myClasses && myClasses.length > 0 && (
                            <Card className="rounded-2xl border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5 text-primary" />
                                        کلاس‌های من
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {myClasses.map((cls: any) => (
                                        <div key={cls.id} className="p-3 bg-muted/40 rounded-xl border space-y-2">
                                            <p className="font-bold text-sm">{cls.title}</p>
                                            <p className="text-xs text-muted-foreground">{cls.schedule}</p>
                                            {cls.meetLink ? (
                                                <a href={cls.meetLink} target="_blank" rel="noopener noreferrer">
                                                    <Button size="sm" className="w-full rounded-lg gap-2">
                                                        <Video className="w-4 h-4" />
                                                        ورود به کلاس
                                                    </Button>
                                                </a>
                                            ) : (
                                                <p className="text-xs text-amber-600 text-center py-1">لینک به‌زودی اضافه می‌شود</p>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Badges Showcase */}
                        <Card className="rounded-2xl border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-500" />
                                    نشان‌ها
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {badgesData?.badges?.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {badgesData.badges.map((badge: any) => {
                                            const isEarned = badgesData.earned?.some((e: any) => e.badgeId === badge.id);
                                            return (
                                                <motion.div
                                                    key={badge.id}
                                                    whileHover={{ scale: 1.1 }}
                                                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${isEarned
                                                        ? 'bg-amber-50 shadow-sm'
                                                        : 'opacity-30 grayscale'
                                                        }`}
                                                    title={badge.description}
                                                >
                                                    <span className="text-2xl mb-1">{badge.icon}</span>
                                                    <span className="text-[10px] font-medium text-center leading-tight text-gray-700">{badge.name}</span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-4">نشان‌ها به زودی فعال می‌شوند!</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Profile Completion */}
                        <Card className="rounded-2xl border-none shadow-sm sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-lg">وضعیت پروفایل</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="relative pt-2">
                                    <div className="flex justify-between text-sm font-medium mb-2">
                                        <span className="text-gray-600">تکمیل اطلاعات</span>
                                        <span className="text-primary">65%</span>
                                    </div>
                                    <Progress value={65} className="h-3 rounded-full" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</div>
                                        <span>تایید ایمیل و موبایل</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</div>
                                        <span>تعیین سطح اولیه</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-xs"></div>
                                        <span>افزودن عکس پروفایل</span>
                                    </div>
                                </div>

                                <Link href="/profile">
                                    <Button variant="outline" className="w-full rounded-xl border-dashed">تکمیل پروفایل</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
