import { z } from "zod";

export const topicSchema = z.object({
  id: z.number(),
  title: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,99}$/i, // match github username rules but with repo name length, thanks https://github.com/shinnn/github-username-regex/blob/master/index.js
      "Title may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen."
    ),
  userId: z.number(),
});