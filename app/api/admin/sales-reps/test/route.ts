import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/api";

export async function POST(request: Request) {
  try {
    // Require admin authentication
    const { user, error: authError } = await requireAdmin();
    if (authError) return authError;

    // Validate service role key exists
    if (!process.env.SUPABASE_SERVICE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Create service role client for admin operations
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_SECRET_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Test simple user creation
    console.log("Testing user creation with email:", email);
    const { data: newUser, error: createError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      console.error("Test user creation error:", createError);
      return NextResponse.json(
        { 
          error: createError.message,
          code: createError.code,
          status: createError.status
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Test user created successfully",
      user: {
        id: newUser.user?.id,
        email: newUser.user?.email
      }
    });

  } catch (error) {
    console.error("Error in test user creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}