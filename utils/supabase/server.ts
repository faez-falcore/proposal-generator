// utils/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Silent error in production when cookies cannot be set
            // This happens in static site generation
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch (error) {
            // Silent error in production
          }
        },
      },
    }
  );
}

// These functions are kept for backward compatibility but should be replaced
// with direct usage of the auth provider in client components

export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
