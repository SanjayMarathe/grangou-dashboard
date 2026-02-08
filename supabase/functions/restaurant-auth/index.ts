import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateToken(user: { id: number; email: string }) {
  const payload = { userId: user.id, email: user.email, timestamp: Date.now() };
  return btoa(JSON.stringify(payload));
}

function decodeToken(token: string): { userId: number; email: string } | null {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

async function handleLogin(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return jsonResponse({ error: "Bad Request", message: "Email and password are required" }, 400);
  }

  const { data, error } = await supabase
    .from("restaraunts")
    .select("id, email, name, created_at, updated_at")
    .eq("email", email.toLowerCase())
    .eq("password", password)
    .single();

  if (error || !data) {
    return jsonResponse({ error: "Unauthorized", message: "Invalid email or password" }, 401);
  }

  const token = generateToken({ id: data.id, email: data.email });
  return jsonResponse({ token, user: data });
}

async function handleVerify(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized", message: "No token provided" }, 401);
  }

  const token = authHeader.substring(7);
  const payload = decodeToken(token);

  if (!payload || !payload.userId) {
    return jsonResponse({ error: "Unauthorized", message: "Invalid token" }, 401);
  }

  const { data, error } = await supabase
    .from("restaraunts")
    .select("id, email, name, created_at, updated_at")
    .eq("id", payload.userId)
    .single();

  if (error || !data) {
    return jsonResponse({ error: "Unauthorized", message: "User not found" }, 401);
  }

  return jsonResponse({ user: data });
}

function handleLogout() {
  return jsonResponse({ success: true, message: "Logged out successfully" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  switch (path) {
    case "login":
      if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }
      return handleLogin(req);

    case "verify":
      if (req.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }
      return handleVerify(req);

    case "logout":
      if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }
      return handleLogout();

    default:
      return jsonResponse({ error: "Not Found", message: `Unknown action: ${path}` }, 404);
  }
});
