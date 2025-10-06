import { publicProcedure, router } from "../index";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK" as const;
  }),
});
export type AppRouter = typeof appRouter;
