import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // This is needed for production deployments
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Update response cookies
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // This is needed for production deployments
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          // Update response cookies
          response.cookies.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          });
        },
      },
    },
  );

  // This will refresh the session if needed (safe for middleware cookie management)
  // Note: getSession() is used here only for session refresh, not for authentication verification
  await supabase.auth.getSession();

  return response;
}
