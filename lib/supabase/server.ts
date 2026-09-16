import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client reading session cookies.
 * Adheres to Next.js 15 asynchronous cookies() pattern.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
}

/**
 * Server-side Admin client with Service Role privileges.
 * Strictly used in trusted server-side routes (migrations, crons, system ingestion).
 * NEVER import or expose in client components.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (serviceKey === "[SENSITIVE]" || serviceKey.includes("[SENSITIVE]")) {
    serviceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Helper to resolve the authenticated Supabase user ID,
 * falling back to null if unauthenticated.
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Helper to resolve the effective user ID for user-bound operations.
 * If an authenticated Supabase user exists, returns their real user.id.
 * Otherwise, falls back to the default demo user ("user_primary").
 */
export async function getEffectiveUserId(): Promise<string> {
  const user = await getAuthenticatedUser();
  return user?.id || "user_primary";
}
