import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import type { Prisma } from "@/app/generated/prisma/client";
import { emailTicket } from "@/lib/ticket-email";

/**
 * This functions locks the event row in the database for the duration of the transaction to prevent race conditions when multiple users are trying to RSVP or request tickets for the same event at the same time.
 */
async function lockEvent(tx: Prisma.TransactionClient, eventId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${eventId}))`;
}

async function deliverTicketEmail(ticketId: string) {
  try {
    await emailTicket(ticketId);
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The ticket was granted, but its email could not be sent. Please retry to send it.",
    });
  }
}

export const ticketRouter = createTRPCRouter({
  rsvp: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.$transaction(async (tx) => {
        await lockEvent(tx, input.eventId);

        const event = await tx.event.findUnique({
          where: { id: input.eventId },
          select: {
            id: true,
            eventType: true,
            attendeeLimit: true,
            date: true,
          },
        });

        if (!event)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found.",
          });

        if (event.eventType !== "FREE") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This event requires a ticket request instead of a RSVP.",
          });
        }

        if (event.date <= new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You can’t RSVP to an event that has already started.",
          });
        }

        if (event.date <= new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You can’t RSVP to an event that has already started.",
          });
        }

        const existing = await tx.ticket.findFirst({
          where: { eventId: event.id, userId: ctx.session.user.id },
          select: { id: true },
        });

        if (existing) {
          const attendeeCount = await tx.ticket.count({
            where: { eventId: event.id },
          });
          return {
            ticketId: existing.id,
            attendeeCount,
            alreadyRegistered: true,
          };
        }

        const attendeeCount = await tx.ticket.count({
          where: { eventId: event.id },
        });

        if (
          event.attendeeLimit !== null &&
          attendeeCount >= event.attendeeLimit
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This event has reached its attendee limit.",
          });
        }

        const ticket = await tx.ticket.create({
          data: { eventId: event.id, userId: ctx.session.user.id, price: 0 },
          select: { id: true },
        });

        return {
          ticketId: ticket.id,
          attendeeCount: attendeeCount + 1,
          alreadyRegistered: false,
        };
      });
      await deliverTicketEmail(result.ticketId);
      return result;
    }),

  cancelRsvp: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return db.$transaction(async (tx) => {
        await lockEvent(tx, input.eventId);

        const event = await tx.event.findUnique({
          where: { id: input.eventId },
          select: { id: true, eventType: true, date: true },
        });

        if (!event)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found.",
          });

        if (event.eventType !== "FREE") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "This event requires a ticket request instead of a RSVP cancellation.",
          });
        }

        if (event.date <= new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "You can’t cancel your RSVP for an event that has already started.",
          });
        }

        const existing = await tx.ticket.findFirst({
          where: { eventId: event.id, userId: ctx.session.user.id },
          select: { id: true },
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "You are not registered for this event.",
          });
        }

        await tx.ticket.delete({ where: { id: existing.id } });

        const attendeeCount = await tx.ticket.count({
          where: { eventId: event.id },
        });

        return { attendeeCount };
      });
    }),

  requestPaid: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return db.$transaction(async (tx) => {
        await lockEvent(tx, input.eventId);

        const event = await tx.event.findUnique({
          where: { id: input.eventId },
          select: {
            id: true,
            eventType: true,
            price: true,
            attendeeLimit: true,
            date: true,
          },
        });

        if (!event)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found.",
          });
        if (event.eventType !== "PAID") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This event is free. RSVP for a ticket instead.",
          });
        }
        if (event.price <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The organizer hasn’t set a ticket price yet.",
          });
        }
        if (event.date <= new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "You can’t request a ticket for an event that has already started.",
          });
        }

        const existingTicket = await tx.ticket.findFirst({
          where: { eventId: event.id, userId: ctx.session.user.id },
          select: { id: true },
        });
        if (existingTicket) {
          return {
            requestId: null,
            status: "ticketed" as const,
            attendeeCount: await tx.ticket.count({
              where: { eventId: event.id },
            }),
          };
        }

        const existingRequest = await tx.ticketRequest.findFirst({
          where: { eventId: event.id, userId: ctx.session.user.id },
          orderBy: { requestedAt: "desc" },
          select: { id: true, status: true },
        });
        if (existingRequest && !["rejected", "cancelled"].includes(existingRequest.status)) {
          const [ticketCount, activeRequestCount] = await Promise.all([
            tx.ticket.count({ where: { eventId: event.id } }),
            tx.ticketRequest.count({
              where: {
                eventId: event.id,
                status: { in: ["pending", "approved"] },
              },
            }),
          ]);
          return {
            requestId: existingRequest.id,
            status:
              existingRequest.status === "approved"
                ? ("approved" as const)
                : ("pending" as const),
            attendeeCount: ticketCount + activeRequestCount,
          };
        }

        const [ticketCount, activeRequestCount] = await Promise.all([
          tx.ticket.count({ where: { eventId: event.id } }),
          tx.ticketRequest.count({
            where: {
              eventId: event.id,
              status: { in: ["pending", "approved"] },
            },
          }),
        ]);
        const attendeeCount = ticketCount + activeRequestCount;
        if (
          event.attendeeLimit !== null &&
          attendeeCount >= event.attendeeLimit
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This event has reached its attendee limit.",
          });
        }

        const request = existingRequest
          ? await tx.ticketRequest.update({
              where: { id: existingRequest.id },
              data: { status: "pending", requestedAt: new Date() },
              select: { id: true, status: true },
            })
          : await tx.ticketRequest.create({
              data: { eventId: event.id, userId: ctx.session.user.id },
              select: { id: true, status: true },
            });

        return {
          requestId: request.id,
          status: "pending" as const,
          attendeeCount: attendeeCount + 1,
        };
      });
    }),

  requests: protectedProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        query: z.string().trim().max(100).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const event = await db.event.findUnique({
        where: { id: input.eventId },
        select: {
          id: true,
          name: true,
          eventType: true,
          price: true,
          clubId: true,
          attendeeLimit: true,
        },
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
        throw new TRPCError({ code: "FORBIDDEN", message: "Only club founders and managers can view ticket requests." });
      }
      if (event.eventType !== "PAID") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only paid events have ticket requests." });
      }

      const search = input.query?.trim();
      const requests = await db.ticketRequest.findMany({
        where: {
          eventId: event.id,
          ...(search
            ? {
                user: {
                  is: {
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { email: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              }
            : {}),
        },
        orderBy: { requestedAt: "desc" },
        select: {
          id: true,
          status: true,
          requestedAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      return { event, requests };
    }),

  markPaid: protectedProcedure
    .input(
      z.object({
        requestId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.$transaction(async (tx) => {
        const requestReference = await tx.ticketRequest.findUnique({
          where: { id: input.requestId },
          select: { eventId: true },
        });
        if (!requestReference) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket request not found." });

        await lockEvent(tx, requestReference.eventId);
        const request = await tx.ticketRequest.findUnique({
          where: { id: input.requestId },
          select: {
            id: true,
            eventId: true,
            userId: true,
            status: true,
            event: { select: { eventType: true, price: true, clubId: true } },
          },
        });
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket request not found." });

        const membership = await tx.membership.findFirst({
          where: {
            clubId: request.event.clubId,
            userId: ctx.session.user.id,
            role: { in: ["FOUNDER", "MANAGER"] },
          },
          select: { id: true },
        });
        if (!membership) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only club founders and managers can grant tickets." });
        }
        if (request.event.eventType !== "PAID") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only paid-event requests can be marked paid." });
        }
        if (request.event.price <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The organizer hasn’t set a ticket price yet.",
          });
        }

        const existingTicket = await tx.ticket.findFirst({
          where: { eventId: request.eventId, userId: request.userId },
          select: { id: true, price: true },
        });
        if (existingTicket) {
          if (request.status !== "paid") {
            await tx.ticketRequest.update({ where: { id: request.id }, data: { status: "paid" } });
          }
          return { ticketId: existingTicket.id, price: existingTicket.price, alreadyGranted: true };
        }

        if (!["pending", "approved"].includes(request.status)) {
          throw new TRPCError({ code: "CONFLICT", message: "Only an active request can be marked paid." });
        }

        const ticket = await tx.ticket.create({
          data: {
            eventId: request.eventId,
            userId: request.userId,
            price: request.event.price,
          },
          select: { id: true, price: true },
        });
        await tx.ticketRequest.update({ where: { id: request.id }, data: { status: "paid" } });

        return { ticketId: ticket.id, price: ticket.price, alreadyGranted: false };
      });
      await deliverTicketEmail(result.ticketId);
      return result;
    }),

  cancelRequest: protectedProcedure
    .input(z.object({ requestId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return db.$transaction(async (tx) => {
        const requestReference = await tx.ticketRequest.findUnique({
          where: { id: input.requestId },
          select: { eventId: true },
        });
        if (!requestReference) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket request not found." });

        await lockEvent(tx, requestReference.eventId);
        const request = await tx.ticketRequest.findUnique({
          where: { id: input.requestId },
          select: {
            id: true,
            eventId: true,
            status: true,
            event: { select: { clubId: true, eventType: true } },
          },
        });
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket request not found." });
        const membership = await tx.membership.findFirst({
          where: {
            clubId: request.event.clubId,
            userId: ctx.session.user.id,
            role: { in: ["FOUNDER", "MANAGER"] },
          },
          select: { id: true },
        });
        if (!membership) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only club founders and managers can cancel ticket requests." });
        }
        if (request.event.eventType !== "PAID") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only paid-event requests can be canceled." });
        }
        if (request.status === "cancelled") return { cancelled: false };
        if (!["pending", "approved"].includes(request.status)) {
          throw new TRPCError({ code: "CONFLICT", message: "Only an active request can be canceled." });
        }

        await tx.ticketRequest.update({ where: { id: request.id }, data: { status: "cancelled" } });
        return { cancelled: true };
      });
    }),

  attendees: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const event = await db.event.findUnique({
        where: { id: input.eventId },
        select: { id: true, name: true, date: true, eventType: true, clubId: true },
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
        throw new TRPCError({ code: "FORBIDDEN", message: "Only club founders and managers can view ticket holders." });
      }

      const tickets = await db.ticket.findMany({
        where: { eventId: event.id },
        orderBy: { purchasedAt: "asc" },
        select: {
          id: true,
          price: true,
          purchasedAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      return { event, tickets };
    }),
});
