import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// B2B database (Grangou website) — auto-provided by Supabase
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
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

type AuthRestaurant = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  trial_ends_at: string | null;
  license_activated_at: string | null;
};

function canUseDashboard(row: Pick<AuthRestaurant, "trial_ends_at" | "license_activated_at">): boolean {
  if (row.license_activated_at) return true;
  if (!row.trial_ends_at) return false;
  return Date.now() < new Date(row.trial_ends_at).getTime();
}

async function authenticate(req: Request): Promise<AuthRestaurant | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const payload = decodeToken(authHeader.substring(7));
  if (!payload || !payload.userId) return null;

  const { data } = await b2b
    .from("restaraunts")
    .select("id, name, email, created_at, trial_ends_at, license_activated_at")
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

async function handleMetrics(restaurantName: string, restaurantId: number) {
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

  // Try real revenue from guest_orders with menu item prices
  const { data: orderRevenue } = await b2b
    .from("guest_orders")
    .select("ordered_at, quantity, menu_items(price)")
    .eq("restaurant_id", restaurantId);

  const hasRealRevenue = (orderRevenue || []).some((o: any) => o.menu_items?.price != null);

  let estimatedRevenue: number;
  let currentRevenue = 0;
  let previousRevenue = 0;

  if (hasRealRevenue && orderRevenue && orderRevenue.length > 0) {
    // Use real order data
    estimatedRevenue = 0;
    orderRevenue.forEach((o: any) => {
      const price = Number(o.menu_items?.price) || 0;
      const qty = o.quantity || 1;
      const amount = price * qty;
      estimatedRevenue += amount;

      const date = new Date(o.ordered_at);
      if (date >= thirtyDaysAgo) currentRevenue += amount;
      else if (date >= sixtyDaysAgo) previousRevenue += amount;
    });
  } else {
    // Fallback: $35 per person estimate
    const avgCostPerPerson = 35;
    let totalGuests = 0;
    completedMatches.forEach((m) => {
      totalGuests += (m.matched_user_ids || []).length;
    });
    estimatedRevenue = totalGuests * avgCostPerPerson;

    completedMatches.forEach((m) => {
      const date = new Date(m.completed_at || m.created_at);
      const guests = (m.matched_user_ids || []).length;
      if (date >= thirtyDaysAgo) currentRevenue += guests * avgCostPerPerson;
      else if (date >= sixtyDaysAgo) previousRevenue += guests * avgCostPerPerson;
    });
  }

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

  // Repeat visitors change (current 30 days vs previous 30 days)
  const currentVisitCounts: Record<string, number> = {};
  const previousVisitCounts: Record<string, number> = {};
  completedMatches.forEach((m) => {
    const date = new Date(m.completed_at || m.created_at);
    (m.matched_user_ids || []).forEach((uid: string) => {
      if (date >= thirtyDaysAgo) {
        currentVisitCounts[uid] = (currentVisitCounts[uid] || 0) + 1;
      } else if (date >= sixtyDaysAgo) {
        previousVisitCounts[uid] = (previousVisitCounts[uid] || 0) + 1;
      }
    });
  });
  const currentUniqueUsers = Object.keys(currentVisitCounts).length;
  const currentRepeatUsers = Object.values(currentVisitCounts).filter((c) => c >= 2).length;
  const currentRepeatRate = currentUniqueUsers > 0 ? (currentRepeatUsers / currentUniqueUsers) * 100 : 0;
  const previousUniqueUsers = Object.keys(previousVisitCounts).length;
  const previousRepeatUsers = Object.values(previousVisitCounts).filter((c) => c >= 2).length;
  const previousRepeatRate = previousUniqueUsers > 0 ? (previousRepeatUsers / previousUniqueUsers) * 100 : 0;
  const repeatVisitorsChange = previousRepeatRate > 0
    ? Math.round(((currentRepeatRate - previousRepeatRate) / previousRepeatRate) * 100 * 10) / 10
    : 0;

  return {
    totalGrangouGuests,
    guestGrowth,
    estimatedRevenue,
    revenueGrowth,
    averageRating,
    ratingChange,
    totalReviews,
    repeatVisitors,
    repeatVisitorsChange,
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

async function handleFlavors(restaurantId: number, period?: string) {
  // Determine date filter
  let dateFilter: string | null = null;
  const now = new Date();
  if (period === "week") {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (period === "month") {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
  // "all" or undefined = no date filter

  // Get total order quantity for percentage calculation
  let totalQuery = b2b
    .from("guest_orders")
    .select("quantity")
    .eq("restaurant_id", restaurantId);
  if (dateFilter) totalQuery = totalQuery.gte("ordered_at", dateFilter);
  const { data: allOrders } = await totalQuery;
  const totalQuantity = (allOrders || []).reduce((sum: number, o: { quantity: number }) => sum + (o.quantity || 1), 0);

  if (totalQuantity === 0) {
    // No orders logged yet — return empty array (frontend shows setup prompt)
    return [];
  }

  // Get top 5 items by total quantity
  let ordersQuery = b2b
    .from("guest_orders")
    .select("menu_item_id, quantity, menu_items(name, category)")
    .eq("restaurant_id", restaurantId);
  if (dateFilter) ordersQuery = ordersQuery.gte("ordered_at", dateFilter);
  const { data: orders } = await ordersQuery;

  // Aggregate by menu item
  const itemMap: Record<number, { name: string; category: string; totalQty: number; orderCount: number }> = {};
  (orders || []).forEach((o: any) => {
    const id = o.menu_item_id;
    if (!itemMap[id]) {
      const mi = o.menu_items;
      itemMap[id] = {
        name: mi?.name || "Unknown Item",
        category: mi?.category || "",
        totalQty: 0,
        orderCount: 0,
      };
    }
    itemMap[id].totalQty += o.quantity || 1;
    itemMap[id].orderCount += 1;
  });

  const sorted = Object.values(itemMap)
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 5);

  return sorted.map((item) => ({
    item: item.name,
    category: item.category,
    percentage: Math.round((item.totalQty / totalQuantity) * 100),
    orders: item.totalQty,
  }));
}

// ============================================
// MENU MANAGEMENT
// ============================================

async function handleMenuGet(restaurantId: number) {
  const { data, error } = await b2b
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function handleMenuCreate(restaurantId: number, body: any) {
  // Support bulk create (array) or single item
  const items = Array.isArray(body) ? body : [body];

  const rows = items.map((item: any) => ({
    restaurant_id: restaurantId,
    name: item.name,
    category: item.category || null,
    price: item.price || null,
    is_active: true,
  }));

  const { data, error } = await b2b
    .from("menu_items")
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
}

async function handleMenuUpdate(restaurantId: number, body: any) {
  const { id, name, category, price, is_active } = body;
  if (!id) throw new Error("Menu item id is required");

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (category !== undefined) updates.category = category;
  if (price !== undefined) updates.price = price;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await b2b
    .from("menu_items")
    .update(updates)
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleMenuDelete(restaurantId: number, itemId: number) {
  // Soft delete
  const { data, error } = await b2b
    .from("menu_items")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// ORDER LOGGING
// ============================================

async function handleOrdersGet(restaurantId: number) {
  const { data, error } = await b2b
    .from("guest_orders")
    .select("*, menu_items(name, category, price)")
    .eq("restaurant_id", restaurantId)
    .order("ordered_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

async function handleOrdersCreate(restaurantId: number, body: any) {
  const { match_id, items } = body;
  // items = [{ menu_item_id, quantity }]
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("items array is required");
  }

  const rows = items.map((item: any) => ({
    restaurant_id: restaurantId,
    match_id: match_id || null,
    menu_item_id: item.menu_item_id,
    quantity: item.quantity || 1,
  }));

  const { data, error } = await b2b
    .from("guest_orders")
    .insert(rows)
    .select("*, menu_items(name, category, price)");

  if (error) throw error;
  return data;
}

async function handleOrdersForMatch(restaurantId: number, matchId: string) {
  const { data, error } = await b2b
    .from("guest_orders")
    .select("*, menu_items(name, category, price)")
    .eq("restaurant_id", restaurantId)
    .eq("match_id", matchId);

  if (error) throw error;
  return data || [];
}

async function handleOrdersDelete(restaurantId: number, body: any) {
  const { match_id } = body;
  if (!match_id) throw new Error("match_id is required");

  const { error } = await b2b
    .from("guest_orders")
    .delete()
    .eq("restaurant_id", restaurantId)
    .eq("match_id", match_id);

  if (error) throw error;
  return { success: true };
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
// PAYMENT INSIGHTS (Stripe + Square + Clover)
// Aggregates line-item / charge data from all connected integrations.
// ============================================

const SQUARE_API_VERSION = "2024-01-18";

type InsightSourceRow = { name: string; revenue: number; count: number; source: string };

async function fetchStripeInsightRows(accessToken: string): Promise<InsightSourceRow[]> {
  const response = await fetch("https://api.stripe.com/v1/charges?limit=100", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok || !data.data?.length) return [];

  const itemMap: Record<string, { revenue: number; count: number }> = {};

  for (const charge of data.data) {
    if (charge.status !== "succeeded") continue;
    const key = (charge.description || "Other").trim();
    if (!itemMap[key]) itemMap[key] = { revenue: 0, count: 0 };
    itemMap[key].revenue += charge.amount / 100;
    itemMap[key].count += 1;
  }

  return Object.entries(itemMap).map(([name, v]) => ({
    name,
    revenue: v.revenue,
    count: v.count,
    source: "stripe",
  }));
}

function squareHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Square-Version": SQUARE_API_VERSION,
    "Content-Type": "application/json",
  };
}

/** Square: completed orders with line_items; falls back to list payments if needed. */
async function fetchSquareInsightRows(accessToken: string): Promise<InsightSourceRow[]> {
  const headers = squareHeaders(accessToken);

  const locRes = await fetch("https://connect.squareup.com/v2/locations", { headers });
  const locJson = await locRes.json();
  if (!locRes.ok || !locJson.locations?.length) {
    return fetchSquarePaymentsInsightRows(headers);
  }

  const locationIds = (locJson.locations as { id: string }[]).map((l) => l.id);

  const searchRes = await fetch("https://connect.squareup.com/v2/orders/search", {
    method: "POST",
    headers,
    body: JSON.stringify({
      location_ids: locationIds,
      query: {
        filter: {
          state_filter: {
            states: ["COMPLETED"],
          },
        },
        sort: {
          sort_field: "CLOSED_AT",
          sort_order: "DESC",
        },
      },
      limit: 100,
    }),
  });
  const searchJson = await searchRes.json();
  const orders = (searchRes.ok && searchJson.orders) ? searchJson.orders as Record<string, unknown>[] : [];

  const fromOrders: InsightSourceRow[] = [];
  const itemMap: Record<string, { revenue: number; count: number }> = {};

  for (const order of orders) {
    const lineItems = (order.line_items || order.lineItems) as Record<string, unknown>[] | undefined;
    if (!lineItems?.length) continue;
    for (const li of lineItems) {
      const name = String(li.name || "Other").trim();
      const money = (li.total_money || li.totalMoney) as { amount?: number } | undefined;
      const gross = (li.gross_sales_money || li.grossSalesMoney) as { amount?: number } | undefined;
      const cents = money?.amount ?? gross?.amount ?? 0;
      if (cents <= 0) continue;
      const qtyRaw = li.quantity ?? "1";
      const qty = parseFloat(String(qtyRaw)) || 1;
      if (!itemMap[name]) itemMap[name] = { revenue: 0, count: 0 };
      itemMap[name].revenue += cents / 100;
      itemMap[name].count += qty;
    }
  }

  for (const [name, v] of Object.entries(itemMap)) {
    fromOrders.push({ name, revenue: v.revenue, count: v.count, source: "square" });
  }

  if (fromOrders.length > 0) return fromOrders;
  return fetchSquarePaymentsInsightRows(headers);
}

async function fetchSquarePaymentsInsightRows(
  headers: Record<string, string>,
): Promise<InsightSourceRow[]> {
  const payRes = await fetch("https://connect.squareup.com/v2/payments?limit=100", { headers });
  const payJson = await payRes.json();
  if (!payRes.ok || !payJson.payments?.length) return [];

  const itemMap: Record<string, { revenue: number; count: number }> = {};
  for (const p of payJson.payments as Record<string, unknown>[]) {
    const status = String(p.status || "");
    if (status !== "COMPLETED" && status !== "APPROVED" && status !== "CAPTURED") continue;
    const name = String(p.note || p.statement_description_identifier || "Square payment").trim();
    const amountMoney = p.amount_money as { amount?: number } | undefined;
    const cents = amountMoney?.amount ?? 0;
    if (cents <= 0) continue;
    if (!itemMap[name]) itemMap[name] = { revenue: 0, count: 0 };
    itemMap[name].revenue += cents / 100;
    itemMap[name].count += 1;
  }

  return Object.entries(itemMap).map(([name, v]) => ({
    name,
    revenue: v.revenue,
    count: v.count,
    source: "square",
  }));
}

/** Clover: orders with line items (unitQty scaled ×1000 per Clover API). */
async function fetchCloverInsightRows(
  accessToken: string,
  merchantId: string,
): Promise<InsightSourceRow[]> {
  const url =
    `https://api.clover.com/v3/merchants/${merchantId}/orders?limit=100&expand=lineItems`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  if (!res.ok) return [];

  const elements = (data.elements || []) as Record<string, unknown>[];
  const itemMap: Record<string, { revenue: number; count: number }> = {};

  for (const order of elements) {
    const lineItemsObj = order.lineItems as { elements?: Record<string, unknown>[] } | undefined;
    const lines = lineItemsObj?.elements || [];
    for (const li of lines) {
      const name = String(li.name || "Other").trim();
      const price = typeof li.price === "number" ? li.price : parseInt(String(li.price || 0), 10);
      const unitQty = typeof li.unitQty === "number" ? li.unitQty : 1000;
      const lineCents = Math.round((price * unitQty) / 1000);
      if (lineCents <= 0) continue;
      if (!itemMap[name]) itemMap[name] = { revenue: 0, count: 0 };
      itemMap[name].revenue += lineCents / 100;
      itemMap[name].count += unitQty / 1000;
    }
  }

  return Object.entries(itemMap).map(([name, v]) => ({
    name,
    revenue: v.revenue,
    count: Math.round(v.count * 1000) / 1000,
    source: "clover",
  }));
}

function mergeAndRankPaymentInsights(rows: InsightSourceRow[]): Array<{
  item: string;
  revenue: number;
  count: number;
  percentage: number;
  sources?: string[];
}> {
  const map = new Map<string, { item: string; revenue: number; count: number; sources: Set<string> }>();

  for (const r of rows) {
    const raw = (r.name || "Other").trim();
    const key = raw.toLowerCase() || "other";
    const ex = map.get(key);
    if (ex) {
      ex.revenue += r.revenue;
      ex.count += r.count;
      ex.sources.add(r.source);
    } else {
      map.set(key, {
        item: raw || "Other",
        revenue: r.revenue,
        count: r.count,
        sources: new Set([r.source]),
      });
    }
  }

  const totalRevenue = [...map.values()].reduce((s, x) => s + x.revenue, 0);
  if (totalRevenue <= 0) return [];

  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((x) => ({
      item: x.item,
      revenue: Math.round(x.revenue * 100) / 100,
      count: Math.round(x.count * 100) / 100,
      percentage: Math.round((x.revenue / totalRevenue) * 100),
      sources: [...x.sources].sort(),
    }));
}

/** GET stripe-insights — combines Stripe charges, Square orders/payments, Clover order line items. */
async function handlePaymentInsights(restaurantId: number) {
  const { data: r } = await b2b
    .from("restaraunts")
    .select(
      "stripe_access_token, stripe_connected, square_access_token, square_connected, square_merchant_id, clover_access_token, clover_connected, clover_merchant_id",
    )
    .eq("id", restaurantId)
    .single();

  if (!r) return [];

  const tasks: Promise<InsightSourceRow[]>[] = [];

  if (r.stripe_connected && r.stripe_access_token) {
    tasks.push(fetchStripeInsightRows(r.stripe_access_token));
  }
  if (r.square_connected && r.square_access_token && r.square_merchant_id) {
    tasks.push(fetchSquareInsightRows(r.square_access_token));
  }
  if (r.clover_connected && r.clover_access_token && r.clover_merchant_id) {
    tasks.push(fetchCloverInsightRows(r.clover_access_token, r.clover_merchant_id));
  }

  if (tasks.length === 0) return [];

  const settled = await Promise.allSettled(tasks);
  const rows: InsightSourceRow[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled" && s.value.length) rows.push(...s.value);
  }

  if (rows.length === 0) return [];

  return mergeAndRankPaymentInsights(rows);
}

// ============================================
// INTEGRATIONS HANDLERS
// ============================================

async function handleGetIntegrations(restaurantId: number) {
  const { data } = await b2b
    .from("restaraunts")
    .select("stripe_connected, stripe_user_id, clover_connected, clover_merchant_id, square_connected, square_merchant_id")
    .eq("id", restaurantId)
    .single();

  return {
    stripe: {
      connected: data?.stripe_connected || false,
      stripe_user_id: data?.stripe_user_id || null,
    },
    clover: {
      connected: data?.clover_connected || false,
      merchant_id: data?.clover_merchant_id || null,
    },
    square: {
      connected: data?.square_connected || false,
      square_merchant_id: data?.square_merchant_id || null,
    },
  };
}

async function handleStripeConnect(restaurantId: number, code: string) {
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;

  const tokenResponse = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_secret: stripeSecretKey,
      code,
      grant_type: "authorization_code",
    }).toString(),
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    throw new Error(tokenData.error_description || tokenData.error);
  }

  const { access_token, stripe_user_id } = tokenData;

  const { error } = await b2b
    .from("restaraunts")
    .update({
      stripe_access_token: access_token,
      stripe_user_id,
      stripe_connected: true,
    })
    .eq("id", restaurantId);

  if (error) throw error;

  return { success: true, stripe_user_id };
}

async function handleStripeDisconnect(restaurantId: number) {
  const { error } = await b2b
    .from("restaraunts")
    .update({
      stripe_access_token: null,
      stripe_user_id: null,
      stripe_connected: false,
    })
    .eq("id", restaurantId);

  if (error) throw error;
  return { success: true };
}

async function handleSquareConnect(restaurantId: number, code: string, redirectUri: string) {
  const squareAppId = Deno.env.get("SQUARE_APP_ID")!;
  const squareAppSecret = Deno.env.get("SQUARE_APP_SECRET")!;

  const tokenResponse = await fetch("https://connect.squareup.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Square-Version": "2024-01-18",
    },
    body: JSON.stringify({
      client_id: squareAppId,
      client_secret: squareAppSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.errors) {
    throw new Error(tokenData.errors[0]?.detail || "Square OAuth failed");
  }

  const { access_token, merchant_id } = tokenData;

  const { error } = await b2b
    .from("restaraunts")
    .update({
      square_access_token: access_token,
      square_merchant_id: merchant_id,
      square_connected: true,
    })
    .eq("id", restaurantId);

  if (error) throw error;

  return { success: true, square_merchant_id: merchant_id };
}

async function handleSquareDisconnect(restaurantId: number) {
  const { error } = await b2b
    .from("restaraunts")
    .update({
      square_access_token: null,
      square_merchant_id: null,
      square_connected: false,
    })
    .eq("id", restaurantId);

  if (error) throw error;
  return { success: true };
}

// ============================================
// CLOVER INTEGRATION HANDLERS
// ============================================

async function handleCloverConnect(restaurantId: number, code: string, merchantId: string) {
  const cloverAppId = Deno.env.get("CLOVER_APP_ID")!;
  const cloverAppSecret = Deno.env.get("CLOVER_APP_SECRET")!;

  const tokenUrl = new URL("https://www.clover.com/oauth/token");
  tokenUrl.searchParams.set("client_id", cloverAppId);
  tokenUrl.searchParams.set("client_secret", cloverAppSecret);
  tokenUrl.searchParams.set("code", code);

  const tokenResponse = await fetch(tokenUrl.toString(), {
    method: "GET",
    headers: { "Accept": "application/json" },
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.error || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || "Clover token exchange failed");
  }

  const { access_token } = tokenData;

  const { error } = await b2b
    .from("restaraunts")
    .update({
      clover_access_token: access_token,
      clover_merchant_id: merchantId,
      clover_connected: true,
    })
    .eq("id", restaurantId);

  if (error) throw error;

  return { success: true, merchant_id: merchantId };
}

async function handleCloverDisconnect(restaurantId: number) {
  const { error } = await b2b
    .from("restaraunts")
    .update({
      clover_access_token: null,
      clover_merchant_id: null,
      clover_connected: false,
    })
    .eq("id", restaurantId);

  if (error) throw error;
  return { success: true };
}

// ============================================
// INTEGRATION ACCOUNT INFO HANDLERS
// ============================================

async function handleStripeAccountInfo(restaurantId: number) {
  const { data } = await b2b
    .from("restaraunts")
    .select("stripe_access_token, stripe_user_id, stripe_connected")
    .eq("id", restaurantId)
    .single();

  if (!data?.stripe_connected || !data?.stripe_access_token) {
    return { error: "Not connected" };
  }

  try {
    const response = await fetch(`https://api.stripe.com/v1/accounts/${data.stripe_user_id}`, {
      headers: { "Authorization": `Bearer ${data.stripe_access_token}` },
    });
    const account = await response.json();
    return {
      business_name: account.business_profile?.name || account.display_name || null,
      email: account.email || null,
      country: account.country || null,
      charges_enabled: account.charges_enabled ?? null,
      currency: account.default_currency?.toUpperCase() || null,
      account_id: data.stripe_user_id,
    };
  } catch {
    return { account_id: data.stripe_user_id };
  }
}

async function handleSquareAccountInfo(restaurantId: number) {
  const { data } = await b2b
    .from("restaraunts")
    .select("square_access_token, square_merchant_id, square_connected")
    .eq("id", restaurantId)
    .single();

  if (!data?.square_connected || !data?.square_access_token) {
    return { error: "Not connected" };
  }

  try {
    const response = await fetch(`https://connect.squareup.com/v2/merchants/${data.square_merchant_id}`, {
      headers: {
        "Authorization": `Bearer ${data.square_access_token}`,
        "Square-Version": "2024-11-20",
      },
    });
    const result = await response.json();
    const merchant = result.merchant || {};
    return {
      business_name: merchant.business_name || null,
      country: merchant.country || null,
      currency: merchant.currency || null,
      status: merchant.status || null,
      merchant_id: data.square_merchant_id,
    };
  } catch {
    return { merchant_id: data.square_merchant_id };
  }
}

async function handleCloverAccountInfo(restaurantId: number) {
  const { data } = await b2b
    .from("restaraunts")
    .select("clover_access_token, clover_merchant_id, clover_connected")
    .eq("id", restaurantId)
    .single();

  if (!data?.clover_connected || !data?.clover_access_token) {
    return { error: "Not connected" };
  }

  try {
    const response = await fetch(`https://api.clover.com/v3/merchants/${data.clover_merchant_id}`, {
      headers: { "Authorization": `Bearer ${data.clover_access_token}` },
    });
    const merchant = await response.json();
    return {
      name: merchant.name || null,
      email: merchant.owner?.email || null,
      country: merchant.country || null,
      phone: merchant.phoneNumber || null,
      merchant_id: data.clover_merchant_id,
    };
  } catch {
    return { merchant_id: data.clover_merchant_id };
  }
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Authenticate
  const user = await authenticate(req);
  if (!user) {
    return jsonResponse({ error: "Unauthorized", message: "Invalid or missing token" }, 401);
  }

  if (!canUseDashboard(user)) {
    return jsonResponse(
      {
        code: "PAYWALL",
        message: "Your trial has ended. Enter a valid license access code to continue.",
        trialEndsAt: user.trial_ends_at,
        licensed: false,
      },
      402,
    );
  }

  const restaurantName = user.name;
  const restaurantId = user.id;
  const url = new URL(req.url);
  const fullPath = url.pathname;
  const path = fullPath.split("/").pop();
  const method = req.method;

  try {
    // Integration routes (check full path)
    if (fullPath.includes("/integrations/stripe/connect") && method === "POST") {
      const body = await req.json();
      if (!body.code) return jsonResponse({ error: "code is required" }, 400);
      return jsonResponse(await handleStripeConnect(restaurantId, body.code));
    }
    if (fullPath.includes("/integrations/stripe/disconnect") && method === "DELETE") {
      return jsonResponse(await handleStripeDisconnect(restaurantId));
    }
    if (fullPath.includes("/integrations/clover/connect") && method === "POST") {
      const body = await req.json();
      if (!body.code) return jsonResponse({ error: "code is required" }, 400);
      return jsonResponse(await handleCloverConnect(restaurantId, body.code, body.merchant_id || ""));
    }
    if (fullPath.includes("/integrations/clover/disconnect") && method === "DELETE") {
      return jsonResponse(await handleCloverDisconnect(restaurantId));
    }
    if (fullPath.includes("/integrations/square/connect") && method === "POST") {
      const body = await req.json();
      if (!body.code) return jsonResponse({ error: "code is required" }, 400);
      return jsonResponse(await handleSquareConnect(restaurantId, body.code, body.redirect_uri || ""));
    }
    if (fullPath.includes("/integrations/square/disconnect") && method === "DELETE") {
      return jsonResponse(await handleSquareDisconnect(restaurantId));
    }
    if (fullPath.includes("/integrations/stripe/account") && method === "GET") {
      return jsonResponse(await handleStripeAccountInfo(restaurantId));
    }
    if (fullPath.includes("/integrations/square/account") && method === "GET") {
      return jsonResponse(await handleSquareAccountInfo(restaurantId));
    }
    if (fullPath.includes("/integrations/clover/account") && method === "GET") {
      return jsonResponse(await handleCloverAccountInfo(restaurantId));
    }

    // GET-only endpoints (existing dashboard data)
    if (method === "GET") {
      switch (path) {
        case "integrations":
          return jsonResponse(await handleGetIntegrations(restaurantId));
        case "stripe-insights":
          return jsonResponse(await handlePaymentInsights(restaurantId));
        case "profile":
          return jsonResponse(await handleProfile(restaurantName, user.created_at));
        case "metrics":
          return jsonResponse(await handleMetrics(restaurantName, restaurantId));
        case "experiences":
          return jsonResponse(await handleExperiences(restaurantName));
        case "flavors": {
          const period = url.searchParams.get("period") || undefined;
          return jsonResponse(await handleFlavors(restaurantId, period));
        }
        case "traffic":
          return jsonResponse(await handleTraffic(restaurantName));
        case "suggestions":
          return jsonResponse(handleSuggestions());
        case "match-types":
          return jsonResponse(await handleMatchTypes(restaurantName));
        case "peak-hours":
          return jsonResponse(await handlePeakHours(restaurantName));
        case "menu":
          return jsonResponse(await handleMenuGet(restaurantId));
        case "orders": {
          const matchId = url.searchParams.get("match_id");
          if (matchId) {
            return jsonResponse(await handleOrdersForMatch(restaurantId, matchId));
          }
          return jsonResponse(await handleOrdersGet(restaurantId));
        }
        case "matches-today": {
          // Get recent matches for the order logging UI
          const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
          const { data: recentMatches } = await mobile
            .from("matches")
            .select("id, match_type, matched_user_ids, status, created_at, completed_at")
            .eq("restaurant_name", restaurantName)
            .gte("created_at", twoDaysAgo.toISOString())
            .order("created_at", { ascending: false });

          if (!recentMatches || recentMatches.length === 0) {
            return jsonResponse([]);
          }

          // Resolve user names
          const userIds = new Set<string>();
          recentMatches.forEach((m) => {
            (m.matched_user_ids || []).forEach((uid: string) => userIds.add(uid));
          });
          const { data: users } = await mobile
            .from("users")
            .select("id, first_name, last_name")
            .in("id", Array.from(userIds));
          const userMap: Record<string, { first_name: string; last_name: string }> = {};
          (users || []).forEach((u) => { userMap[u.id] = u; });

          const matchTypeMap: Record<string, string> = {
            "1v1": "1-on-1 Date",
            "group_4": "Group (4)",
          };

          const result = recentMatches.map((m) => {
            const guestNames = (m.matched_user_ids || []).map((uid: string) => {
              const u = userMap[uid];
              return u ? `${u.first_name} ${u.last_name?.charAt(0) || ""}.` : "Guest";
            });
            const date = new Date(m.created_at);
            const timeStr = date.toLocaleString("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            });
            return {
              id: m.id,
              matchType: matchTypeMap[m.match_type] || m.match_type,
              guests: guestNames,
              status: m.status,
              time: timeStr,
              created_at: m.created_at,
            };
          });

          return jsonResponse(result);
        }
      }
    }

    // POST endpoints
    if (method === "POST") {
      const body = await req.json();
      switch (path) {
        case "menu":
          return jsonResponse(await handleMenuCreate(restaurantId, body), 201);
        case "orders":
          return jsonResponse(await handleOrdersCreate(restaurantId, body), 201);
      }
    }

    // PUT endpoints
    if (method === "PUT") {
      const body = await req.json();
      switch (path) {
        case "menu":
          return jsonResponse(await handleMenuUpdate(restaurantId, body));
      }
    }

    // DELETE endpoints
    if (method === "DELETE") {
      switch (path) {
        case "menu": {
          const itemId = url.searchParams.get("id");
          if (!itemId) return jsonResponse({ error: "id query parameter required" }, 400);
          return jsonResponse(await handleMenuDelete(restaurantId, parseInt(itemId)));
        }
        case "orders": {
          const body = await req.json();
          return jsonResponse(await handleOrdersDelete(restaurantId, body));
        }
      }
    }

    return jsonResponse({ error: "Not Found", message: `Unknown action: ${method} ${path}` }, 404);
  } catch (err) {
    console.error("Handler error:", err);
    return jsonResponse({ error: "Internal error", message: (err as Error).message }, 500);
  }
});
