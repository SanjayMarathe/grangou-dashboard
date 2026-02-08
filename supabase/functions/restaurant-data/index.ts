import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// B2B database (grangou website) — auto-provided by Supabase
const b2bUrl = Deno.env.get("SUPABASE_URL")!;
const b2bKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const b2b = createClient(b2bUrl, b2bKey);

// Mobile app database (read-only)
const mobileUrl = Deno.env.get("MOBILE_APP_URL") || "https://fnfeiitawuvgtxfpmmvg.supabase.co";
const mobileKey = Deno.env.get("MOBILE_APP_SERVICE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZmVpaXRhd3V2Z3R4ZnBtbXZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg0NTU2OCwiZXhwIjoyMDc2NDIxNTY4fQ.z-Ac1WQYw0HypAWW_TUiqCcyoh2KBV7cJ1PbuyRjvlo";
const mobile = createClient(mobileUrl, mobileKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeToken(token: string): { userId: number; email: string } | null {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

async function authenticate(req: Request): Promise<{ id: number; name: string; email: string; created_at: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const payload = decodeToken(authHeader.substring(7));
  if (!payload || !payload.userId) return null;

  const { data } = await b2b
    .from("restaraunts")
    .select("id, name, email, created_at")
    .eq("id", payload.userId)
    .single();

  return data;
}

// ============================================
// DATA HANDLERS
// ============================================

async function handleProfile(restaurantName: string, createdAt: string) {
  // Get cuisine and location from the most recent match for this restaurant
  const { data: match } = await mobile
    .from("matches")
    .select("restaurant_data")
    .eq("restaurant_name", restaurantName)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const restaurantData = match?.restaurant_data || {};

  const partnerDate = new Date(createdAt);
  const partnerSince = partnerDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return {
    name: restaurantName,
    cuisine: restaurantData.cuisine || "Not specified",
    location: restaurantData.address || "Not specified",
    partnerSince,
    logo: restaurantData.image || "🍽️",
  };
}

async function handleMetrics(restaurantName: string) {
  // Get all matches for this restaurant
  const { data: allMatches } = await mobile
    .from("matches")
    .select("id, match_type, status, matched_user_ids, completion_feedback, created_at, completed_at")
    .eq("restaurant_name", restaurantName);

  const matches = allMatches || [];

  // Total unique guests from completed matches
  const completedMatches = matches.filter((m) => m.status === "completed_successful");
  const allUserIds = new Set<string>();
  completedMatches.forEach((m) => {
    (m.matched_user_ids || []).forEach((uid: string) => allUserIds.add(uid));
  });
  const totalGrangouGuests = allUserIds.size;

  // Guest growth: compare last 30 days vs previous 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const currentPeriodGuests = new Set<string>();
  const previousPeriodGuests = new Set<string>();

  completedMatches.forEach((m) => {
    const date = new Date(m.completed_at || m.created_at);
    (m.matched_user_ids || []).forEach((uid: string) => {
      if (date >= thirtyDaysAgo) currentPeriodGuests.add(uid);
      else if (date >= sixtyDaysAgo) previousPeriodGuests.add(uid);
    });
  });

  const guestGrowth = previousPeriodGuests.size > 0
    ? Math.round(((currentPeriodGuests.size - previousPeriodGuests.size) / previousPeriodGuests.size) * 100 * 10) / 10
    : 0;

  // Estimated revenue (use $35 per person as default)
  const avgCostPerPerson = 35;
  let totalGuests = 0;
  completedMatches.forEach((m) => {
    totalGuests += (m.matched_user_ids || []).length;
  });
  const estimatedRevenue = totalGuests * avgCostPerPerson;

  // Revenue growth (same period comparison)
  let currentRevenue = 0;
  let previousRevenue = 0;
  completedMatches.forEach((m) => {
    const date = new Date(m.completed_at || m.created_at);
    const guests = (m.matched_user_ids || []).length;
    if (date >= thirtyDaysAgo) currentRevenue += guests * avgCostPerPerson;
    else if (date >= sixtyDaysAgo) previousRevenue += guests * avgCostPerPerson;
  });
  const revenueGrowth = previousRevenue > 0
    ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100 * 10) / 10
    : 0;

  // Average rating
  const ratingsData = matches
    .filter((m) => m.completion_feedback?.rating != null)
    .map((m) => Number(m.completion_feedback.rating));

  const averageRating = ratingsData.length > 0
    ? Math.round((ratingsData.reduce((a, b) => a + b, 0) / ratingsData.length) * 10) / 10
    : 0;

  const totalReviews = ratingsData.length;

  // Rating change (current vs previous period)
  const currentRatings: number[] = [];
  const previousRatings: number[] = [];
  matches
    .filter((m) => m.completion_feedback?.rating != null)
    .forEach((m) => {
      const date = new Date(m.completed_at || m.created_at);
      if (date >= thirtyDaysAgo) currentRatings.push(Number(m.completion_feedback.rating));
      else if (date >= sixtyDaysAgo) previousRatings.push(Number(m.completion_feedback.rating));
    });

  const currentAvg = currentRatings.length > 0 ? currentRatings.reduce((a, b) => a + b, 0) / currentRatings.length : 0;
  const previousAvg = previousRatings.length > 0 ? previousRatings.reduce((a, b) => a + b, 0) / previousRatings.length : 0;
  const ratingChange = currentRatings.length > 0 && previousRatings.length > 0
    ? Math.round((currentAvg - previousAvg) * 10) / 10
    : 0;

  // Repeat visitors percentage
  const userVisitCounts: Record<string, number> = {};
  completedMatches.forEach((m) => {
    (m.matched_user_ids || []).forEach((uid: string) => {
      userVisitCounts[uid] = (userVisitCounts[uid] || 0) + 1;
    });
  });
  const totalUniqueUsers = Object.keys(userVisitCounts).length;
  const repeatUsers = Object.values(userVisitCounts).filter((c) => c >= 2).length;
  const repeatVisitors = totalUniqueUsers > 0 ? Math.round((repeatUsers / totalUniqueUsers) * 100) : 0;

  return {
    totalGrangouGuests,
    guestGrowth,
    estimatedRevenue,
    revenueGrowth,
    averageRating,
    ratingChange,
    totalReviews,
    repeatVisitors,
  };
}

async function handleExperiences(restaurantName: string) {
  // Get matches with completion_feedback
  const { data: matches } = await mobile
    .from("matches")
    .select("id, match_type, matched_user_ids, completion_feedback, completed_at, created_at")
    .eq("restaurant_name", restaurantName)
    .not("completion_feedback", "is", null)
    .order("completed_at", { ascending: false })
    .limit(10);

  if (!matches || matches.length === 0) return [];

  // Collect all user IDs from these matches
  const allUserIds = new Set<string>();
  matches.forEach((m) => {
    (m.matched_user_ids || []).forEach((uid: string) => allUserIds.add(uid));
  });

  // Fetch user details from mobile app
  const { data: users } = await mobile
    .from("users")
    .select("id, first_name, last_name, preferred_cuisines")
    .in("id", Array.from(allUserIds));

  const userMap: Record<string, { first_name: string; last_name: string; preferred_cuisines: string[] }> = {};
  (users || []).forEach((u) => {
    userMap[u.id] = u;
  });

  const matchTypeMap: Record<string, string> = {
    "1v1": "1-on-1 Dinner Date",
    "group_4": "Group Hangout (4)",
  };

  return matches.map((m, idx) => {
    // Pick the first user with a name for display
    const firstUserId = (m.matched_user_ids || [])[0];
    const user = userMap[firstUserId];
    const firstName = user?.first_name || "Guest";
    const lastInitial = user?.last_name ? user.last_name.charAt(0) + "." : "";

    // Collect keywords from all matched users' preferred cuisines
    const keywords = new Set<string>();
    (m.matched_user_ids || []).forEach((uid: string) => {
      const u = userMap[uid];
      (u?.preferred_cuisines || []).forEach((c: string) => keywords.add(c));
    });

    // Compute timeAgo
    const completedDate = new Date(m.completed_at || m.created_at);
    const diffMs = Date.now() - completedDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    let timeAgo = "just now";
    if (diffDays > 0) timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    else if (diffHours > 0) timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    return {
      id: idx + 1,
      userName: `${firstName} ${lastInitial}`,
      avatar: `${firstName.charAt(0)}${user?.last_name?.charAt(0) || ""}`.toUpperCase(),
      rating: m.completion_feedback?.rating || 0,
      review: m.completion_feedback?.feedback || "No feedback provided",
      matchType: matchTypeMap[m.match_type] || m.match_type,
      keywords: Array.from(keywords).slice(0, 3),
      timeAgo,
      acknowledged: false,
    };
  });
}

function handleFlavors() {
  // Mock data — no real source exists
  return [
    { item: "Truffle Parmesan Fries", percentage: 87, orders: 234 },
    { item: "Spicy Tuna Tartare", percentage: 76, orders: 189 },
    { item: "Matcha Latte", percentage: 72, orders: 178 },
    { item: "Grilled Salmon Bowl", percentage: 65, orders: 156 },
    { item: "Chocolate Lava Cake", percentage: 58, orders: 142 },
  ];
}

async function handleTraffic(restaurantName: string) {
  // Get matches from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data: matches } = await mobile
    .from("matches")
    .select("created_at")
    .eq("restaurant_name", restaurantName)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  if (!matches || matches.length === 0) {
    // Return empty 30-day range
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      result.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        visitors: 0,
      });
    }
    return result;
  }

  // Group by date
  const dateCounts: Record<string, number> = {};
  matches.forEach((m) => {
    const date = new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dateCounts[date] = (dateCounts[date] || 0) + 1;
  });

  // Fill in all 30 days
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    result.push({
      date: dateStr,
      visitors: dateCounts[dateStr] || 0,
    });
  }

  return result;
}

function handleSuggestions() {
  // Mock data — needs AI generation logic
  return [
    {
      id: 1,
      type: "insight",
      title: "Outdoor Seating Opportunity",
      message: "40% of your Grangou matches prefer outdoor seating. Consider highlighting your patio section in your app profile!",
      icon: "sun",
    },
    {
      id: 2,
      type: "trend",
      title: "Weekend Date Nights Trending",
      message: "Saturday evening bookings through Grangou are up 35% this month. Consider a special weekend tasting menu!",
      icon: "trending-up",
    },
    {
      id: 3,
      type: "action",
      title: "Respond to Recent Reviews",
      message: "You have 3 unacknowledged guest experiences. Responding to reviews can boost your visibility on Grangou.",
      icon: "message-circle",
    },
  ];
}

async function handleMatchTypes(restaurantName: string) {
  const { data: matches } = await mobile
    .from("matches")
    .select("match_type")
    .eq("restaurant_name", restaurantName);

  if (!matches || matches.length === 0) {
    return [
      { type: "1-on-1 Dates", percentage: 0, color: "#FF3B3F" },
      { type: "Group Hangouts", percentage: 0, color: "#06D6A0" },
    ];
  }

  const counts: Record<string, number> = {};
  matches.forEach((m) => {
    counts[m.match_type] = (counts[m.match_type] || 0) + 1;
  });

  const total = matches.length;
  const typeMap: Record<string, { label: string; color: string }> = {
    "1v1": { label: "1-on-1 Dates", color: "#FF3B3F" },
    "group_4": { label: "Group Hangouts", color: "#06D6A0" },
  };

  return Object.entries(counts).map(([type, count]) => ({
    type: typeMap[type]?.label || type,
    percentage: Math.round((count / total) * 100),
    color: typeMap[type]?.color || "#FFD166",
  }));
}

async function handlePeakHours(restaurantName: string) {
  const { data: matches } = await mobile
    .from("matches")
    .select("created_at")
    .eq("restaurant_name", restaurantName);

  // Define hours range (11 AM - 9 PM)
  const hourLabels = ["11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM"];
  const hourCounts: Record<number, number> = {};

  if (matches && matches.length > 0) {
    matches.forEach((m) => {
      const hour = new Date(m.created_at).getUTCHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
  }

  return hourLabels.map((label) => {
    // Parse hour from label
    const isPM = label.includes("PM");
    let hour = parseInt(label);
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    return {
      hour: label,
      traffic: hourCounts[hour] || 0,
    };
  });
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Authenticate
  const user = await authenticate(req);
  if (!user) {
    return jsonResponse({ error: "Unauthorized", message: "Invalid or missing token" }, 401);
  }

  const restaurantName = user.name;
  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  switch (path) {
    case "profile":
      return jsonResponse(await handleProfile(restaurantName, user.created_at));

    case "metrics":
      return jsonResponse(await handleMetrics(restaurantName));

    case "experiences":
      return jsonResponse(await handleExperiences(restaurantName));

    case "flavors":
      return jsonResponse(handleFlavors());

    case "traffic":
      return jsonResponse(await handleTraffic(restaurantName));

    case "suggestions":
      return jsonResponse(handleSuggestions());

    case "match-types":
      return jsonResponse(await handleMatchTypes(restaurantName));

    case "peak-hours":
      return jsonResponse(await handlePeakHours(restaurantName));

    default:
      return jsonResponse({ error: "Not Found", message: `Unknown action: ${path}` }, 404);
  }
});
