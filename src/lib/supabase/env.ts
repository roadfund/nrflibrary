function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill in your Supabase project's URL and keys.`,
    );
  }
  return value;
}

// Each `NEXT_PUBLIC_*` var is accessed as a static `process.env.X` property
// expression (not a dynamic/computed lookup) so Next.js can inline it into
// the browser bundle at build time - a computed access like
// `process.env[name]` isn't statically analyzable, so it silently stays
// undefined on the client.

export function getSupabaseUrl(): string {
  return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseServiceRoleKey(): string {
  return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
}
