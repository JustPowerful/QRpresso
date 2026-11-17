import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/trpc/init";
import { clubRouter } from "@/trpc/routers/club";
import { eventRouter } from "@/trpc/routers/event";
import { ticketRouter } from "@/trpc/routers/ticket";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ ok: true })),
  me: protectedProcedure.query(({ ctx }) => ctx.session.user),
  club: clubRouter,
  event: eventRouter,
  ticket: ticketRouter,
});

export type AppRouter = typeof appRouter;
