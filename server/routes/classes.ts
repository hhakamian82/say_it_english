
import { Router } from "express";
import { storage } from "../storage";
import { api } from "../../shared/routes";
import { AuthenticatedRequest, isAdmin } from "../utils/auth";

export const classesRouter = Router();

// Public: list classes with enrollment counts (no meet_link)
classesRouter.get(api.classes.list.path, async (req, res) => {
  const classes = await storage.getClassesWithCounts();
  res.json(classes);
});

// Student: my enrolled classes (includes meet_link)
classesRouter.get(api.classes.myClasses.path, async (req: AuthenticatedRequest, res) => {
  if (!req.isAuthenticated() || !req.user) return res.status(401).send("Unauthorized");
  const myClasses = await storage.getMyClasses(req.user.id);
  res.json(myClasses);
});

// Public: feature flags for the client (mirrors api/index.ts's /api/payment/config)
classesRouter.get("/api/payment/config", async (req, res) => {
  res.json({
    onlineClassPaymentEnabled: process.env.ENABLE_ONLINE_CLASS_PAYMENT === 'true' && !!process.env.ZARINPAL_MERCHANT_ID,
  });
});

// Admin: list all classes (all fields)
classesRouter.get("/api/admin/classes", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) return res.status(403).send("Unauthorized");
  const classes = await storage.getClassesWithCounts();
  res.json(classes);
});

// Admin: create class
classesRouter.post("/api/admin/classes", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) return res.status(403).send("Unauthorized");
  const cls = await storage.createClass(req.body);
  res.status(201).json(cls);
});

// Admin: update class
classesRouter.patch("/api/admin/classes/:id", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) return res.status(403).send("Unauthorized");
  const updated = await storage.updateClass(parseInt(req.params.id), req.body);
  if (!updated) return res.status(404).send("Class not found");
  res.json(updated);
});

// Admin: delete class (blocked while students are enrolled)
classesRouter.delete("/api/admin/classes/:id", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) return res.status(403).send("Unauthorized");
  const classId = parseInt(req.params.id);
  const enrolled = await storage.getClassEnrollments(classId);
  if (enrolled.length > 0) {
    return res.status(409).json({ error: "این کلاس ثبت‌نام فعال دارد و قابل حذف نیست" });
  }
  const deleted = await storage.deleteClass(classId);
  if (!deleted) return res.status(404).send("Class not found");
  res.json({ success: true });
});

// Admin: class enrollment list
classesRouter.get("/api/admin/classes/:id/enrollments", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) return res.status(403).send("Unauthorized");
  const list = await storage.getClassEnrollments(parseInt(req.params.id));
  res.json(list);
});
