import { z } from 'zod';

// Manually-defined zod schemas (NOT drizzle-zod). A past incident (see MANA_MEMORY.md)
// found that importing drizzle-zod's createInsertSchema into this shared file — which is
// bundled into both the client and the Vercel serverless function — crashed Vercel's
// runtime. These mirror the real table shapes in shared/schema.ts without that dependency.
const insertUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).optional(),
  phone: z.string().regex(/^09\d{9}$/).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
});

const insertContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['podcast', 'article', 'video']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  contentUrl: z.string().optional(),
  videoId: z.string().optional(),
  videoProvider: z.string().optional(),
  arvanVideoId: z.string().optional(),
  arvanVideoProvider: z.string().optional(),
  fileKey: z.string().optional(),
  isPremium: z.boolean().optional(),
  price: z.number().int().nonnegative().optional(),
  thumbnailUrl: z.string().optional(),
  body: z.string().optional(),
  slug: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const insertBookingSchema = z.object({
  timeSlotId: z.number().optional(),
  type: z.enum(['consultation', 'private_class']),
  date: z.string(), // ISO date string; server converts to Date
  notes: z.string().optional(),
  phone: z.string().optional(),
  paymentMethod: z.enum(['card', 'crypto']).optional(),
  trackingCode: z.string().optional(),
  transactionHash: z.string().optional(),
});

const insertClassSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  level: z.string(),
  capacity: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  schedule: z.string(),
});

const insertEnrollmentSchema = z.object({
  classId: z.number(),
});

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.object({ id: z.number(), username: z.string(), role: z.string() }),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ id: z.number(), username: z.string(), role: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.object({ id: z.number(), username: z.string(), role: z.string(), level: z.string().nullable() }).nullable(),
      },
    },
  },
  content: {
    list: {
      method: 'GET' as const,
      path: '/api/content',
      responses: {
        200: z.array(z.any()), // Refine if possible
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/content',
      input: insertContentSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/content/:id',
      input: insertContentSchema.partial(),
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/content/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  bookings: {
    create: {
      method: 'POST' as const,
      path: '/api/bookings',
      input: insertBookingSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/bookings',
      responses: {
        200: z.array(z.any()),
      },
    },
  },
  classes: {
    list: {
      method: 'GET' as const,
      path: '/api/classes',
      responses: {
        200: z.array(z.any()),
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
    updateRole: {
      method: 'PATCH' as const,
      path: '/api/users/:id/role',
      input: z.object({ role: z.enum(['student', 'admin']) }),
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
  },
};
