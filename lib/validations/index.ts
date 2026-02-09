import { z } from "zod";

export const voteBodySchema = z.object({
  electionId: z.number().int().positive(),
  positionId: z.number().int().positive(),
  candidateId: z.number().int().positive(),
});

export const positionBodySchema = z.object({
  electionId: z.number().int().positive(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  seatsCount: z.number().int().min(1).default(1),
  gradeEligibility: z.array(z.string()).optional().default([]),
  orderIndex: z.number().int().min(0).default(0),
});

export const partyBodySchema = z.object({
  electionId: z.number().int().positive().nullable(),
  name: z.string().min(1).max(255),
  color: z.string().max(32).optional(),
});

export const candidateBodySchema = z.object({
  positionId: z.number().int().positive(),
  partyId: z.number().int().positive().nullable(),
  name: z.string().min(1).max(255),
  grade: z.string().max(32).optional(),
  bio: z.string().optional(),
  imageUrl: z
    .string()
    .optional()
    .refine((s) => !s || s === "" || s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://"), "Invalid image URL")
    .or(z.literal("")),
});

export const voterBodySchema = z.object({
  studentId: z.string().min(1).max(64),
  name: z.string().max(255).optional(),
  password: z.string().min(6).max(128),
  role: z.enum(["voter", "admin"]).default("voter"),
});

export const electionBodySchema = z.object({
  name: z.string().min(1).max(255),
  academicYear: z.string().min(1).max(32),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.number().int().min(0).max(1).default(1),
});
