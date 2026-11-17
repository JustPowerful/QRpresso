import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { Prisma } from "@/app/generated/prisma/client";

export const clubRouter = createTRPCRouter({
  joinedClubs: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await db.membership.findMany({
      where: { userId: ctx.session.user.id },
      select: {
        club: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            profileImage: true,
            coverImage: true,
          },
        },
      },
    });

    return memberships.map((membership) => membership.club);
  }),
  paginateClubs: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        query: z.string().trim().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, limit, query } = input;
      const offset = (page - 1) * limit;

      const whereClause: Prisma.ClubWhereInput = query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {};

      const [clubs, total] = await Promise.all([
        db.club.findMany({
          where: whereClause,
          skip: offset,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            profileImage: true,
            coverImage: true,
          },
        }),
        db.club.count({ where: whereClause }),
      ]);

      return {
        clubs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),
  join: protectedProcedure
    .input(z.object({ clubId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const club = await db.club.findUnique({
        where: { id: input.clubId },
        select: { id: true },
      });

      if (!club) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Club not found." });
      }

      const existingMembership = await db.membership.findFirst({
        where: { clubId: input.clubId, userId: ctx.session.user.id },
        select: { id: true },
      });

      if (existingMembership) return { joined: false };

      await db.membership.create({
        data: {
          clubId: input.clubId,
          userId: ctx.session.user.id,
          role: "MEMBER",
        },
      });

      return { joined: true };
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(100),
        description: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return db.$transaction(async (tx) => {
        const club = await tx.club.create({
          data: {
            name: input.name,
            description: input.description || null,
          },
          select: { id: true, name: true, description: true },
        });

        await tx.membership.create({
          data: {
            userId: ctx.session.user.id,
            clubId: club.id,
            role: "FOUNDER",
          },
        });

        return club;
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        clubId: z.string().min(1),
        name: z.string().trim().min(2).max(100),
        description: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return db.$transaction(async (tx) => {
        const founderMembership = await tx.membership.findFirst({
          where: {
            clubId: input.clubId,
            userId: ctx.session.user.id,
            role: "FOUNDER",
          },
          select: { id: true },
        });

        if (!founderMembership)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only a club founder can update this club.",
          });

        const updatedClub = await tx.club.update({
          where: { id: input.clubId },
          data: {
            name: input.name,
            description: input.description || null,
          },
          select: { id: true, name: true, description: true },
        });

        return updatedClub;
      });
    }),
  delete: protectedProcedure
    .input(z.object({ clubId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return db.$transaction(async (tx) => {
        const founderMembership = await tx.membership.findFirst({
          where: {
            clubId: input.clubId,
            userId: ctx.session.user.id,
            role: "FOUNDER",
          },
          select: { id: true },
        });

        if (!founderMembership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only a club founder can delete this club.",
          });
        }

        await tx.club.delete({ where: { id: input.clubId } });
        return { success: true, clubId: input.clubId };
      });
    }),
});
