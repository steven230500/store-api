import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),

  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),

  WOMPI_BASE_URL: z.string().url().optional(),
  WOMPI_PUBLIC_KEY: z.string().optional(),
  WOMPI_PRIVATE_KEY: z.string().optional(),
  WOMPI_EVENTS_KEY: z.string().optional(),
  WOMPI_INTEGRITY_KEY: z.string().optional(),
});

export default function validate(env: Record<string, unknown>) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    throw new Error(JSON.stringify(parsed.error.issues, null, 2));
  }
  return parsed.data;
}
