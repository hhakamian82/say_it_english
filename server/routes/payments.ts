import { Router } from "express";
import { storage } from "../storage";
import { AuthenticatedRequest, isAdmin } from "../utils/auth";
import { transactionRateLimiter } from "../rate-limit";

export const paymentsRouter = Router();

// Create Payment
paymentsRouter.post("/api/payments", transactionRateLimiter, async (req: AuthenticatedRequest, res) => {
  if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);

  const { classId } = req.body;
  if (classId) {
    // Group-class enrollment payment: price comes from the class, never the client
    const classes = await storage.getClassesWithCounts();
    const cls = classes.find((c: any) => c.id === classId);
    if (!cls) return res.status(404).json({ error: "کلاس یافت نشد" });

    const myClasses = await storage.getMyClasses(req.user.id);
    if (myClasses.some((c: any) => c.id === classId)) {
      return res.status(409).json({ error: "شما قبلاً در این کلاس ثبت‌نام کرده‌اید" });
    }
    if (cls.enrolled >= cls.capacity) {
      return res.status(409).json({ error: "ظرفیت کلاس تکمیل شده است" });
    }

    const payment = await storage.createPayment({
      ...req.body,
      contentId: null,
      classId,
      amount: cls.price,
      userId: req.user.id,
    });
    return res.status(201).json(payment);
  }

  const payment = await storage.createPayment({ ...req.body, userId: req.user.id });
  res.status(201).json(payment);
});

// Get Payments (Admin)
paymentsRouter.get("/api/payments", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send("Unauthorized");
  }
  const payments = await storage.getPayments();
  res.json(payments);
});

// Update Payment Status (Admin)
paymentsRouter.patch("/api/payments/:id/status", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send("Unauthorized");
  }
  const { status, notes } = req.body;
  const payment = await storage.updatePaymentStatus(parseInt(req.params.id), status, notes);
  if (!payment) return res.status(404).send("Payment not found");

  // If approved, automatically grant access to the user
  if (status === "approved" && payment.contentId) {
    await storage.createPurchase({
      userId: payment.userId,
      contentId: payment.contentId,
      paymentId: payment.id,
    });
  }

  if (status === "approved" && (payment as any).classId) {
    const outcome = await storage.enrollIfCapacity(payment.userId, (payment as any).classId);
    if (outcome === "full") {
      // Seat vanished between submission and approval — revert so the admin sees it
      await storage.updatePaymentStatus(payment.id, "pending");
      return res.status(409).json({ error: "ظرفیت کلاس تکمیل شده است؛ پرداخت به حالت در انتظار برگشت. با دانش‌آموز هماهنگ کنید." });
    }
  }

  res.json(payment);
});

// Get User Purchases
paymentsRouter.get("/api/purchases", async (req: AuthenticatedRequest, res) => {
  if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);
  const purchases = await storage.getUserPurchases(req.user.id);
  res.json(purchases);
});

// Get Payment Settings
paymentsRouter.get("/api/payment-settings", async (req, res) => {
  const settings = await storage.getPaymentSettings();
  res.json(settings);
});

// Update Payment Settings (Admin)
paymentsRouter.put("/api/payment-settings", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send("Unauthorized");
  }
  const settings = await storage.updatePaymentSettings(req.body);
  res.json(settings);
});
