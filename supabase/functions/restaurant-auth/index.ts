import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/** Fallback when `B2B_LICENSE_ACCESS_CODE` is not set in Edge secrets (change via env for production). */
const FALLBACK_LICENSE_ACCESS_CODE = "GRANGOU-B2B-DEMO";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type RestRow = {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  trial_ends_at: string | null;
  license_activated_at: string | null;
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

function buildEntitlement(row: Pick<RestRow, "trial_ends_at" | "license_activated_at">) {
  const licensed = row.license_activated_at != null;
  const trialEndMs = row.trial_ends_at ? new Date(row.trial_ends_at).getTime() : 0;
  const inTrial = !!row.trial_ends_at && Date.now() < trialEndMs;
  const canUseDashboard = licensed || inTrial;
  return {
    canUseDashboard,
    trialEndsAt: row.trial_ends_at,
    licensed,
  };
}

const USER_SELECT =
  "id, email, name, created_at, updated_at, trial_ends_at, license_activated_at";

async function handleLogin(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return jsonResponse({ error: "Bad Request", message: "Email and password are required" }, 400);
  }

  const { data, error } = await supabase
    .from("restaraunts")
    .select(USER_SELECT)
    .eq("email", email.toLowerCase())
    .eq("password", password)
    .single();

  if (error || !data) {
    return jsonResponse({ error: "Unauthorized", message: "Invalid email or password" }, 401);
  }

  const token = generateToken({ id: data.id, email: data.email });
  return jsonResponse({
    token,
    user: data,
    entitlement: buildEntitlement(data),
  });
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
    .select(USER_SELECT)
    .eq("id", payload.userId)
    .single();

  if (error || !data) {
    return jsonResponse({ error: "Unauthorized", message: "User not found" }, 401);
  }

  return jsonResponse({
    user: data,
    entitlement: buildEntitlement(data),
  });
}

function handleLogout() {
  return jsonResponse({ success: true, message: "Logged out successfully" });
}

async function handleRegister(req: Request) {
  const body = await req.json();
  const {
    name,
    email,
    password,
    phone_number,
    address,
    city,
    cuisine_types,
    price_range,
    dietary_options,
    average_cost_per_person,
    website_url,
    image_url,
    description,
  } = body;

  if (!name || !email || !password) {
    return jsonResponse(
      { error: "Bad Request", message: "Restaurant name, email, and password are required" },
      400,
    );
  }

  const emailLower = String(email).toLowerCase();

  const { data: existing } = await supabase
    .from("restaraunts")
    .select("id")
    .eq("email", emailLower)
    .maybeSingle();

  if (existing) {
    return jsonResponse({ error: "Conflict", message: "An account with this email already exists" }, 409);
  }

  const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const insertRow: Record<string, unknown> = {
    name: String(name).trim(),
    email: emailLower,
    password: String(password),
    trial_ends_at: trialEnds,
    license_activated_at: null,
  };

  if (phone_number != null && phone_number !== "") insertRow.phone_number = phone_number;
  if (address != null && address !== "") insertRow.address = address;
  if (city != null && city !== "") insertRow.city = city;
  if (cuisine_types != null && Array.isArray(cuisine_types) && cuisine_types.length > 0) {
    insertRow.cuisine_types = cuisine_types;
  }
  if (price_range != null && price_range !== "") insertRow.price_range = price_range;
  if (dietary_options != null && Array.isArray(dietary_options) && dietary_options.length > 0) {
    insertRow.dietary_options = dietary_options;
  }
  if (average_cost_per_person != null && typeof average_cost_per_person === "number") {
    insertRow.average_cost_per_person = average_cost_per_person;
  }
  if (website_url != null && website_url !== "") insertRow.website_url = website_url;
  if (image_url != null && image_url !== "") insertRow.image_url = image_url;
  if (description != null && description !== "") insertRow.description = description;

  const { data, error } = await supabase
    .from("restaraunts")
    .insert(insertRow)
    .select(USER_SELECT)
    .single();

  if (error || !data) {
    console.error("register insert error:", error);
    return jsonResponse(
      { error: "Internal error", message: error?.message || "Could not create account" },
      500,
    );
  }

  const token = generateToken({ id: data.id, email: data.email });
  return jsonResponse({
    token,
    user: data,
    entitlement: buildEntitlement(data),
  });
}

async function handleActivateLicense(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized", message: "No token provided" }, 401);
  }

  const token = authHeader.substring(7);
  const payload = decodeToken(token);
  if (!payload || !payload.userId) {
    return jsonResponse({ error: "Unauthorized", message: "Invalid token" }, 401);
  }

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Bad Request", message: "Invalid JSON body" }, 400);
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return jsonResponse({ error: "Bad Request", message: "License access code is required" }, 400);
  }

  const expected = Deno.env.get("B2B_LICENSE_ACCESS_CODE") || FALLBACK_LICENSE_ACCESS_CODE;
  if (code !== expected) {
    return jsonResponse({ error: "Forbidden", message: "Invalid license access code" }, 403);
  }

  const { data, error } = await supabase
    .from("restaraunts")
    .update({ license_activated_at: new Date().toISOString() })
    .eq("id", payload.userId)
    .select(USER_SELECT)
    .single();

  if (error || !data) {
    return jsonResponse({ error: "Internal error", message: "Could not activate license" }, 500);
  }

  return jsonResponse({
    success: true,
    user: data,
    entitlement: buildEntitlement(data),
  });
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

    case "register":
      if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }
      return handleRegister(req);

    case "activate-license":
      if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }
      return handleActivateLicense(req);

    default:
      return jsonResponse({ error: "Not Found", message: `Unknown action: ${path}` }, 404);
  }
});
