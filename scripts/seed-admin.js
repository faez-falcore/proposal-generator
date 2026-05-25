#!/usr/bin/env node
/*
 * This script creates an initial admin user in Supabase
 *
 * Usage:
 * node seed-admin.js [email] [password]
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

// Load environment variables from .env.local
const dotenvPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(dotenvPath)) {
  console.log(`Loading environment from: ${dotenvPath}`);
  require("dotenv").config({ path: dotenvPath });
} else {
  console.log("No .env.local found, trying .env");
  require("dotenv").config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_SECRET_KEY;

// Debug info
console.log(`Supabase URL: ${supabaseUrl || "Not Set"}`);
console.log(
  `Service Key: ${supabaseServiceKey ? "****" + supabaseServiceKey.slice(-4) : "Not Set"}`,
);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_SECRET_KEY must be provided as environment variables.",
  );
  process.exit(1);
}

// Make sure URL format is correct
if (!supabaseUrl.startsWith("https://")) {
  console.error("Error: Supabase URL must start with https://");
  console.error(`Current URL: ${supabaseUrl}`);
  process.exit(1);
}

// Get command line arguments (email and password)
const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Usage: node seed-admin.js [email] [password]");
  process.exit(1);
}

// Create Supabase client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedAdmin() {
  try {
    console.log(`Creating admin user with email: ${email}`);

    // First try to sign up the user directly
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      // If user already exists, try to get their UUID
      if (authError.message.includes("already exists")) {
        console.log("User already exists, checking profile...");

        // Try to sign in to get the user
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) {
          console.error("Error signing in to get user ID:", signInError);

          // If we can't sign in, try to get the user ID from auth admin API
          console.log("Trying to get user from admin API...");
          const {
            data: { users },
            error: listError,
          } = await supabase.auth.admin.listUsers();

          if (listError) {
            throw listError;
          }

          const user = users.find((u) => u.email === email);
          if (!user) {
            throw new Error(
              `User with email ${email} exists but could not be retrieved`,
            );
          }

          // Update the user's role in profiles table
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ role: "admin" })
            .eq("id", user.id);

          if (updateError) {
            throw updateError;
          }

          console.log(`Set user ${email} to admin role.`);
        } else {
          // Update the user's role in profiles table using the ID from sign in
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ role: "admin" })
            .eq("id", signInData.user.id);

          if (updateError) {
            throw updateError;
          }

          console.log(`Set user ${email} to admin role.`);
        }
      } else {
        throw authError;
      }
    } else {
      console.log(`Created new user with email: ${email}`);

      // Now set the user's role to admin
      const { error: roleError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", authUser.user.id);

      if (roleError) {
        throw roleError;
      }

      console.log(`Set user ${email} to admin role.`);
    }

    console.log("Admin user created/updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
