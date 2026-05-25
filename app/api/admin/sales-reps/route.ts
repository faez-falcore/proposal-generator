import { createClient } from "@/utils/supabase/server";
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
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists in auth.users
    const { data: existingAuthUsers } = await serviceSupabase.auth.admin.listUsers();
    const existingUser = existingAuthUsers.users?.find(u => u.email === email);
    
    if (existingUser) {
      // Check if profile exists
      const { data: existingProfile } = await serviceSupabase
        .from("profiles")
        .select("id, email")
        .eq("id", existingUser.id)
        .single();

      if (existingProfile) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      } else {
        // User exists in auth but no profile - clean up the orphaned user
        console.log("Cleaning up orphaned user:", existingUser.id);
        await serviceSupabase.auth.admin.deleteUser(existingUser.id);
      }
    }

    // Create user account using service role client
    console.log("Attempting to create user with email:", email);
    const { data: newUser, error: createError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        name: name || null
      }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      console.error("Full error details:", JSON.stringify(createError, null, 2));
      return NextResponse.json(
        { 
          error: createError.message || "Failed to create user account",
          details: createError.code,
          fullError: createError
        },
        { status: 400 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    console.log("User created successfully:", newUser.user.id);

    // Check if profile was auto-created by a trigger
    console.log("Checking if profile already exists for user:", newUser.user.id);
    const { data: existingProfile } = await serviceSupabase
      .from("profiles")
      .select("id, role")
      .eq("id", newUser.user.id)
      .single();

    let profile;
    if (existingProfile) {
      console.log("Profile already exists, updating it");
      // Profile exists, update it with correct data
      const { data: updatedProfile, error: updateError } = await serviceSupabase
        .from("profiles")
        .update({
          email: newUser.user.email,
          name: name || null,
          role: "sales_rep"
        })
        .eq("id", newUser.user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
        // Clean up the auth user
        await serviceSupabase.auth.admin.deleteUser(newUser.user.id);
        return NextResponse.json(
          { error: "Failed to update user profile" },
          { status: 500 }
        );
      }
      profile = updatedProfile;
    } else {
      console.log("Creating new profile for user:", newUser.user.id);
      // No profile exists, create one
      const { data: newProfile, error: profileError } = await serviceSupabase
        .from("profiles")
        .insert({
          id: newUser.user.id,
          email: newUser.user.email,
          name: name || null,
          role: "sales_rep"
        })
        .select()
        .single();

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Clean up the auth user
        await serviceSupabase.auth.admin.deleteUser(newUser.user.id);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }
      profile = newProfile;
    }

    // Log the activity using service client
    try {
      await serviceSupabase.rpc("log_activity", {
        p_action: "create_sales_rep",
        p_entity_type: "user",
        p_entity_id: newUser.user.id,
        p_metadata: {
          email: newUser.user.email,
          name: name,
          created_by: user!.id
        }
      });
    } catch (logError) {
      console.error("Error logging activity:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      message: "Sales representative created successfully",
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        name: profile.name,
        role: profile.role,
        created_at: profile.created_at
      }
    });

  } catch (error) {
    console.error("Error in sales-reps POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Require admin authentication
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const supabase = await createClient();

    // Get all sales reps
    const { data: salesReps, error } = await supabase
      .from("profiles")
      .select("id, email, name, role, created_at, updated_at")
      .eq("role", "sales_rep")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales reps:", error);
      return NextResponse.json(
        { error: "Failed to fetch sales representatives" },
        { status: 500 }
      );
    }

    return NextResponse.json({ salesReps });

  } catch (error) {
    console.error("Error in sales-reps GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
