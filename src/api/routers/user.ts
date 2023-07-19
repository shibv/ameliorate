import { TRPCError } from "@trpc/server";
import _ from "lodash";

import { userSchema } from "../../common/user";
import { isAuthenticated } from "../auth";
import { prisma } from "../prisma";
import { procedure, router } from "../trpc";

export const userRouter = router({
  findByUsername: procedure
    .input(userSchema.pick({ username: true })) // prettier shoves this into one line if this comment isn't here, which is lame, so this comment is here.
    .query(async (opts) => {
      // Can consider making a separate endpoint for withRelations if the extra data becomes a problem and is unnecessary.
      return await prisma.user.findUnique({
        // Manually selecting each column in order to exclude authId.
        // See prisma docs if we want to implement an exclude method, and to track if prisma has implemented it themselves yet https://www.prisma.io/docs/concepts/components/prisma-client/excluding-fields
        select: { id: true, username: true, topics: true },
        where: { username: opts.input.username },
      });
    }),

  findByAuthId: procedure
    .use(isAuthenticated)
    .input(userSchema.pick({ authId: true }))
    .query(async (opts) => {
      // Security-wise, this might not be necessary, but there doesn't seem to be a use case for
      // allowing anyone to query by authId if you're not the user being queried for.
      if (opts.ctx.userAuthId !== opts.input.authId) throw new TRPCError({ code: "FORBIDDEN" });

      return await prisma.user.findUnique({ where: { authId: opts.input.authId } });
    }),

  create: procedure
    .use(isAuthenticated)
    .input(userSchema.pick({ username: true, authId: true }))
    .mutation(async (opts) => {
      if (opts.ctx.userAuthId !== opts.input.authId) throw new TRPCError({ code: "FORBIDDEN" });

      return await prisma.user.create({
        data: {
          username: opts.input.username,
          authId: opts.input.authId,
        },
      });
    }),
});