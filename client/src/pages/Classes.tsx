import { useClasses } from "@/hooks/use-classes";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Loader2 } from "lucide-react";

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

export default function Classes() {
  const { data: classes, isLoading } = useClasses();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const handleEnroll = (classId: number) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate(`/classes/${classId}/enroll`);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">کلاس‌های گروهی</h1>
        <p className="text-muted-foreground text-lg">
          یادگیری در کنار دیگران انگیزه شما را دوچندان می‌کند. کلاس مناسب سطح خود را انتخاب کنید.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : !classes || classes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          در حال حاضر کلاس گروهی فعالی وجود ندارد. به زودی اضافه می‌شود!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((cls: ClassItem) => {
            const isFull = cls.enrolled >= cls.capacity;
            return (
              <Card key={cls.id} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-[2rem] flex flex-col overflow-hidden group">
                <div className="h-3 bg-gradient-to-r from-primary to-secondary w-full" />
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={cls.level === 'advanced' ? 'destructive' : 'secondary'} className="rounded-lg px-3 py-1 font-bold">
                      {cls.level === 'beginner' ? 'مقدماتی' : cls.level === 'intermediate' ? 'متوسط' : 'پیشرفته'}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      <Users className="w-4 h-4 ml-2" />
                      {cls.enrolled}/{cls.capacity} نفر
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{cls.title}</h3>
                </CardHeader>

                <CardContent className="p-8 pt-2 flex-grow">
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {cls.description}
                  </p>

                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 ml-3 text-primary" />
                    <span className="font-medium">{cls.schedule}</span>
                  </div>
                </CardContent>

                <CardFooter className="p-8 pt-0 flex items-center justify-between border-t border-border/30 bg-muted/10 mt-auto">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">شهریه دوره</span>
                    <span className="text-xl font-black text-primary">
                      {cls.price.toLocaleString('fa-IR')} <span className="text-sm font-normal text-muted-foreground">تومان</span>
                    </span>
                  </div>
                  <Button
                    size="lg"
                    disabled={isFull}
                    onClick={() => handleEnroll(cls.id)}
                    className="rounded-xl px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  >
                    {isFull ? "تکمیل ظرفیت" : "ثبت نام"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
