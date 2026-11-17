import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const eventRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z
        .object({
          clubId: z.string().min(1),
          name: z.string().trim().min(2).max(120),
          description: z.string().trim().max(2000).optional(),
          date: z.coerce.date(),
          location: z.string().trim().max(200).optional(),
          eventType: z.enum(["FREE", "PAID"]),
          price: z.number().min(0).max(10_000_000),
          attendeeLimit: z.number().int().positive().max(100_000).optional(),
        })
        .refine((value) => value.eventType !== "PAID" || value.price > 0, {
          message: "Paid events must have a ticket price greater than zero.",
          path: ["price"],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.membership.findFirst({
        where: {
          clubId: input.clubId,
          userId: ctx.session.user.id,
          role: { in: ["FOUNDER", "MANAGER"] },
        },
        select: { id: true },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only club founders and managers can create events.",
        });
      }

      return db.event.create({
        data: {
          clubId: input.clubId,
          name: input.name,
          description: input.description || null,
          date: input.date,
          location: input.location || null,
          eventType: input.eventType,
          price: input.eventType === "PAID" ? input.price : 0,
          attendeeLimit: input.attendeeLimit ?? null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          date: true,
          location: true,
          eventType: true,
          price: true,
          attendeeLimit: true,
        },
      });
    }),
  update: protectedProcedure
    .input(
      z
        .object({
          eventId: z.string().min(1),
          name: z.string().trim().min(2).max(120),
          description: z.string().trim().max(2000).optional(),
          date: z.coerce.date(),
          location: z.string().trim().max(200).optional(),
          eventType: z.enum(["FREE", "PAID"]),
          price: z.number().min(0).max(10_000_000),
          attendeeLimit: z.number().int().positive().max(100_000).optional(),
        })
        .refine((value) => value.eventType !== "PAID" || value.price > 0, {
          message: "Paid events must have a ticket price greater than zero.",
          path: ["price"],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await db.event.findUnique({
        where: { id: input.eventId },
        select: { clubId: true },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
      }

      const membership = await db.membership.findFirst({
        where: {
          clubId: event.clubId,
          userId: ctx.session.user.id,
          role: { in: ["FOUNDER", "MANAGER"] },
        },
        select: { id: true },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only club founders and managers can update events.",
        });
      }

      return db.event.update({
        where: { id: input.eventId },
        data: {
          name: input.name,
          description: input.description || null,
          date: input.date,
          location: input.location || null,
          eventType: input.eventType,
          price: input.eventType === "PAID" ? input.price : 0,
          attendeeLimit: input.attendeeLimit ?? null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          date: true,
          location: true,
          eventType: true,
          price: true,
          attendeeLimit: true,
        },
      });
    }),
  delete: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const event = await db.event.findUnique({
        where: { id: input.eventId },
        select: { clubId: true },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });

      const membership = await db.membership.findFirst({
        where: {
          clubId: event.clubId,
          userId: ctx.session.user.id,
          role: { in: ["FOUNDER", "MANAGER"] },
        },
        select: { id: true },
      });
      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only club founders and managers can delete events.",
        });
      }

      await db.event.delete({ where: { id: input.eventId } });
      return { deleted: true };
    }),
});
