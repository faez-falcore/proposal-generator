import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local");
  process.exit(1);
}

const sessionPath = path.join(process.cwd(), ".claude", ".session.json");

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const existingSession = fs.existsSync(sessionPath)
    ? JSON.parse(fs.readFileSync(sessionPath, "utf-8"))
    : null;

  if (existingSession?.refresh_token) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: existingSession.refresh_token });
    if (!error && data.session) {
      fs.writeFileSync(sessionPath, JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user_email: data.user?.email,
      }), "utf-8");
      console.log(`✓ Session refreshed for ${data.user?.email}`);
      return;
    }
  }

  const email = await ask("Email: ");
  const password = await ask("Password: ");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    console.error("Login failed:", error?.message ?? "Unknown error");
    process.exit(1);
  }

  const sessionDir = path.dirname(sessionPath);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  fs.writeFileSync(sessionPath, JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user_email: data.user.email,
  }), "utf-8");

  console.log(`✓ Logged in as ${data.user.email}. Session saved.`);
}

main().catch(console.error);
