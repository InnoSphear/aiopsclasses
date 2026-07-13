import { z } from 'zod';

export const createBlogSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  content: z.string().min(10, 'Content is required'),
  excerpt: z.string().max(500).optional().default(''),
  category: z.enum(['news', 'tutorial', 'career', 'events', 'general', 'technology', 'placement']).optional().default('general'),
  tags: z.array(z.string()).optional().default([]),
  isPublished: z.boolean().optional().default(false),
  featuredImage: z.object({
    url: z.string().optional().default(''),
    alt: z.string().optional().default(''),
  }).optional(),
  seoTitle: z.string().max(70).optional().default(''),
  seoDescription: z.string().max(160).optional().default(''),
  seoKeywords: z.array(z.string()).optional().default([]),
  ogImage: z.string().optional().default(''),
});

export const updateBlogSchema = createBlogSchema.partial();
