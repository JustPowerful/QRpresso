import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/trpc/init";
import { clubRouter } from "@/trpc/routers/club";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ ok: true })),
  me: protectedProcedure.query(({ ctx }) => ctx.session.user),
  club: clubRouter,
});

export type AppRouter = typeof appRouter;
