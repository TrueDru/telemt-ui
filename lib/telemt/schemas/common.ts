import { z } from "zod";

/** `{ok:true, data:{...}, revision:"sha256-hex"}` */
export function successEnvelope<T extends z.ZodType>(data: T) {
  return z.object({
    ok: z.literal(true),
    data,
    revision: z.string(),
  });
}

/** `{ok:false, error:{code,message}, request_id}` */
export const errorEnvelopeSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  request_id: z.union([z.string(), z.number()]),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export const classCountSchema = z.object({
  class: z.string(),
  total: z.number(),
});

export type ClassCount = z.infer<typeof classCountSchema>;
