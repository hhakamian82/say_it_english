import { AdminLayout } from "./layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { GraduationCap, Plus, Trash2, Pencil, Loader2, Users, Link as LinkIcon } from "lucide-react";
import { ListItemSkeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClassItem {
    id: number;
    title: string;
    description: string | null;
    level: string;
    capacity: number;
    price: number;
    schedule: string;
    meetLink: string | null;
    enrolled: number;
    createdAt: string;
}

interface Enrollment {
    id: number;
    userId: number;
    username: string;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    status: string;
    enrolledAt: string;
}

const emptyForm = {
    title: "",
    description: "",
    level: "beginner",
    capacity: "",
    price: "",
    schedule: "",
    meetLink: "",
};

export default function AdminClasses() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [rosterClassId, setRosterClassId] = useState<number | null>(null);

    const { data: classes, isLoading } = useQuery<ClassItem[]>({
        queryKey: ["/api/admin/classes"],
        queryFn: async () => {
            const res = await fetch("/api/admin/classes", { credentials: "include" });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
    });

    const { data: roster, isLoading: rosterLoading } = useQuery<Enrollment[]>({
        queryKey: ["/api/admin/classes", rosterClassId, "enrollments"],
        queryFn: async () => {
            const res = await fetch(`/api/admin/classes/${rosterClassId}/enrollments`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        enabled: rosterClassId !== null,
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                title: form.title,
                // Explicit null (not undefined) so clearing a field to empty actually
                // persists — undefined would be dropped by JSON.stringify and leave
                // the previous value untouched on PATCH.
                description: form.description || null,
                level: form.level,
                capacity: parseInt(form.capacity),
                price: parseInt(form.price),
                schedule: form.schedule,
                meetLink: form.meetLink || null,
            };
            const res = editingId
                ? await apiRequest("PATCH", `/api/admin/classes/${editingId}`, payload)
                : await apiRequest("POST", "/api/admin/classes", payload);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
            toast({ title: editingId ? "کلاس به‌روزرسانی شد" : "کلاس ایجاد شد" });
            setDialogOpen(false);
            setEditingId(null);
            setForm(emptyForm);
        },
        onError: (err: Error) => toast({ title: "خطا", description: err.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/classes/${id}`, { method: "DELETE", credentials: "include" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to delete");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
            toast({ title: "کلاس حذف شد" });
            setDeleteId(null);
        },
        onError: (err: Error) => toast({ title: "خطا", description: err.message, variant: "destructive" }),
    });

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (cls: ClassItem) => {
        setEditingId(cls.id);
        setForm({
            title: cls.title,
            description: cls.description || "",
            level: cls.level,
            capacity: String(cls.capacity),
            price: String(cls.price),
            schedule: cls.schedule,
            meetLink: cls.meetLink || "",
        });
        setDialogOpen(true);
    };

    const levelLabel = (level: string) =>
        level === "beginner" ? "مقدماتی" : level === "intermediate" ? "متوسط" : "پیشرفته";

    return (
        <AdminLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3">
                            <GraduationCap className="h-8 w-8 text-primary" />
                            کلاس‌های گروهی
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            ایجاد و مدیریت کلاس‌های گروهی، ظرفیت و لینک جلسه
                        </p>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2" onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                کلاس جدید
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingId ? "ویرایش کلاس" : "ایجاد کلاس جدید"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label>عنوان کلاس</Label>
                                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
                                </div>
                                <div>
                                    <Label>توضیحات</Label>
                                    <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>سطح</Label>
                                        <select
                                            value={form.level}
                                            onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                                            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                            <option value="beginner">مقدماتی</option>
                                            <option value="intermediate">متوسط</option>
                                            <option value="advanced">پیشرفته</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>ظرفیت</Label>
                                        <Input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="mt-1" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>شهریه (تومان)</Label>
                                        <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>زمان‌بندی</Label>
                                        <Input placeholder="شنبه‌ها ۱۸:۰۰" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} className="mt-1" />
                                    </div>
                                </div>
                                <div>
                                    <Label>لینک جلسه (Google Meet)</Label>
                                    <Input placeholder="https://meet.google.com/..." value={form.meetLink} onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))} className="mt-1" dir="ltr" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={() => saveMutation.mutate()}
                                    disabled={!form.title || !form.capacity || !form.price || !form.schedule || saveMutation.isPending}
                                >
                                    {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "ذخیره تغییرات" : "ایجاد کلاس"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-6 space-y-4">
                                <ListItemSkeleton /><ListItemSkeleton /><ListItemSkeleton />
                            </div>
                        ) : classes && classes.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="text-right">عنوان</TableHead>
                                        <TableHead className="text-right">سطح</TableHead>
                                        <TableHead className="text-right">شهریه</TableHead>
                                        <TableHead className="text-right">ظرفیت</TableHead>
                                        <TableHead className="text-right">زمان‌بندی</TableHead>
                                        <TableHead className="text-right">لینک جلسه</TableHead>
                                        <TableHead className="text-right">عملیات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classes.map((cls) => (
                                        <TableRow key={cls.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">{cls.title}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{levelLabel(cls.level)}</Badge>
                                            </TableCell>
                                            <TableCell>{new Intl.NumberFormat("fa-IR").format(cls.price)} تومان</TableCell>
                                            <TableCell>
                                                <button
                                                    className="flex items-center gap-1 text-sm hover:underline"
                                                    onClick={() => setRosterClassId(cls.id)}
                                                    title="مشاهده ثبت‌نامی‌ها"
                                                >
                                                    <Users className="h-3.5 w-3.5" />
                                                    {cls.enrolled}/{cls.capacity}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{cls.schedule}</TableCell>
                                            <TableCell>
                                                {cls.meetLink ? (
                                                    <Badge className="bg-green-100 text-green-700 gap-1">
                                                        <LinkIcon className="h-3 w-3" /> تنظیم شده
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">بدون لینک</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cls)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => setDeleteId(cls.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>هنوز کلاسی ایجاد نشده است.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Roster dialog */}
            <Dialog open={rosterClassId !== null} onOpenChange={(open) => !open && setRosterClassId(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>ثبت‌نامی‌های کلاس</DialogTitle>
                    </DialogHeader>
                    {rosterLoading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : roster && roster.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {roster.map((en) => (
                                <div key={en.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border text-sm">
                                    <div>
                                        <p className="font-medium">
                                            {en.firstName || en.lastName ? `${en.firstName || ""} ${en.lastName || ""}`.trim() : en.username}
                                        </p>
                                        <p className="text-muted-foreground text-xs" dir="ltr">{en.phone || "-"}</p>
                                    </div>
                                    <Badge variant="secondary">{en.status === "enrolled" ? "فعال" : en.status}</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-muted-foreground">هنوز کسی ثبت‌نام نکرده است.</p>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            این عمل قابل بازگشت نیست. اگر دانش‌آموزی در این کلاس ثبت‌نام کرده باشد، حذف امکان‌پذیر نخواهد بود.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
                            حذف کلاس
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
