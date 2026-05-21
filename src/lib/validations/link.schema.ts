import { z } from "zod";

export const linkSchema = z.object({
  originalUrl: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL (e.g., https://example.com)"),
  customAlias: z
    .string()
    .max(30, "Alias cannot exceed 30 characters")
    .refine((val) => val === "" || val.length >= 3, {
      message: "Alias must be at least 3 characters if provided",
    })
    .refine((val) => val === "" || /^[a-zA-Z0-9-_]+$/.test(val), {
      message: "Alias can only contain letters, numbers, hyphens, and underscores",
    })
    .optional(),
});

export type LinkSchema = z.infer<typeof linkSchema>;
