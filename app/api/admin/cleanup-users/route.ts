import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/api";

export async function POST(request: Request) {
  try {
    // Require admin authentication
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    // Validate service role key exists
    if (!process.env.SUPABASE_SERVICE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      );
    }

    // Create service role client
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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // List all auth users
    const { data: authData } = await serviceSupabase.auth.admin.listUsers();
    const authUser = authData.users?.find(u => u.email === email);

    if (authUser) {
      console.log("Found auth user:", authUser.id, authUser.email);
      
      // Check if profile exists
      const { data: profile } = await serviceSupabase
        .from("profiles")
        .select("id")
        .eq("id", authUser.id)
        .single();

      console.log("Profile exists:", !!profile);

      // Delete the auth user (this should cascade)
      const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(authUser.id);
      
      if (deleteError) {
        console.error("Error deleting user:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete user: " + deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "User cleaned up successfully",
        deletedUserId: authUser.id,
        hadProfile: !!profile
      });
    } else {
      return NextResponse.json({
        message: "No user found with that email"
      });
    }

  } catch (error) {
    console.error("Error in cleanup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}