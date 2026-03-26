import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// B2B database (grangou website)
const b2bUrl = Deno.env.get("SUPABASE_URL")!;
const b2bKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const b2b = createClient(b2bUrl, b2bKey);

// Mobile app database (read-only) — for Grangou platform tools
const mobileUrl = Deno.env.get("MOBILE_APP_URL") || "https://fnfeiitawuvgtxfpmmvg.supabase.co";
const mobileKey = Deno.env.get("MOBILE_APP_SERVICE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZmVpaXRhd3V2Z3R4ZnBtbXZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg0NTU2OCwiZXhwIjoyMDc2NDIxNTY4fQ.z-Ac1WQYw0HypAWW_TUiqCcyoh2KBV7cJ1PbuyRjvlo";
const mobile = createClient(mobileUrl, mobileKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function decodeToken(token: string): { userId: number; email: string } | null {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

async function authenticate(req: Request): Promise<{
  id: number;
  name: string;
  email: string;
  stripe_access_token?: string;
  stripe_connected?: boolean;
  square_access_token?: string;
  square_connected?: boolean;
} | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const payload = decodeToken(authHeader.substring(7));
  if (!payload || !payload.userId) return null;

  const { data } = await b2b
    .from("restaraunts")
    .select("id, name, email, stripe_access_token, stripe_connected, square_access_token, square_connected")
    .eq("id", payload.userId)
    .single();

  return data;
}

// ============================================
// TOOL DEFINITIONS
// ============================================

const STRIPE_TOOLS = [
  {
    name: "stripe_retrieve_balance",
    description: "Get the current Stripe account balance including available and pending amounts",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "stripe_list_charges",
    description: "List recent charges on the Stripe account",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of charges to return (default 10, max 100)" },
      },
    },
  },
  {
    name: "stripe_list_customers",
    description: "List customers in the Stripe account",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of customers to return (default 10, max 100)" },
      },
    },
  },
  {
    name: "stripe_list_payment_intents",
    description: "List payment intents to see recent transactions and their statuses",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of payment intents to return (default 10)" },
      },
    },
  },
  {
    name: "stripe_list_refunds",
    description: "List refunds issued on the Stripe account",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of refunds to return (default 10)" },
      },
    },
  },
  {
    name: "stripe_list_products",
    description: "List products or experiences configured in Stripe",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of products to return (default 10)" },
      },
    },
  },
];

const SQUARE_TOOLS = [
  {
    name: "square_get_locations",
    description: "Get the restaurant's Square locations (stores/outlets). Call this first before listing orders.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "square_list_orders",
    description: "List recent Square POS orders for the restaurant.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max orders to return (default 10)" },
        location_id: { type: "string", description: "Square location ID (get from square_get_locations)" },
      },
    },
  },
  {
    name: "square_list_payments",
    description: "List recent Square payments/transactions.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max payments to return (default 10)" },
      },
    },
  },
  {
    name: "square_list_customers",
    description: "List Square customer profiles.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max customers to return (default 10)" },
      },
    },
  },
  {
    name: "square_list_catalog",
    description: "List Square catalog items (menu items/products).",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max items to return (default 20)" },
      },
    },
  },
];

const GRANGOU_TOOLS = [
  {
    name: "grangou_get_metrics",
    description: "Get Grangou platform metrics for this restaurant: total unique guests, completed matches, average rating.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "grangou_get_recent_experiences",
    description: "Get recent guest match experiences with ratings and feedback from the Grangou app.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max experiences to return (default 10)" },
      },
    },
  },
  {
    name: "grangou_get_peak_hours",
    description: "Get peak hours traffic data showing when the restaurant is busiest on Grangou (by UTC hour).",
    input_schema: { type: "object", properties: {}, required: [] },
  },
];

// ============================================
// API CALLERS
// ============================================

async function callStripeAPI(
  toolName: string,
  input: Record<string, unknown>,
  stripeToken: string,
): Promise<unknown> {
  const headers = { "Authorization": `Bearer ${stripeToken}` };
  const limit = input.limit || 10;

  const endpointMap: Record<string, string> = {
    stripe_retrieve_balance: "https://api.stripe.com/v1/balance",
    stripe_list_charges: `https://api.stripe.com/v1/charges?limit=${limit}`,
    stripe_list_customers: `https://api.stripe.com/v1/customers?limit=${limit}`,
    stripe_list_payment_intents: `https://api.stripe.com/v1/payment_intents?limit=${limit}`,
    stripe_list_refunds: `https://api.stripe.com/v1/refunds?limit=${limit}`,
    stripe_list_products: `https://api.stripe.com/v1/products?limit=${limit}`,
  };

  const url = endpointMap[toolName];
  if (!url) throw new Error(`Unknown Stripe tool: ${toolName}`);

  const response = await fetch(url, { headers });
  return response.json();
}

async function callSquareAPI(
  toolName: string,
  input: Record<string, unknown>,
  squareToken: string,
): Promise<unknown> {
  const headers = {
    "Authorization": `Bearer ${squareToken}`,
    "Square-Version": "2024-01-18",
    "Content-Type": "application/json",
  };
  const base = "https://connect.squareup.com/v2";
  const limit = input.limit || 10;

  if (toolName === "square_get_locations") {
    const response = await fetch(`${base}/locations`, { headers });
    return response.json();
  }

  if (toolName === "square_list_orders") {
    const searchBody: Record<string, unknown> = { limit };
    if (input.location_id) {
      searchBody.location_ids = [input.location_id];
    }
    const response = await fetch(`${base}/orders/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: {}, ...searchBody }),
    });
    return response.json();
  }

  if (toolName === "square_list_payments") {
    const response = await fetch(`${base}/payments?limit=${limit}`, { headers });
    return response.json();
  }

  if (toolName === "square_list_customers") {
    const response = await fetch(`${base}/customers?limit=${limit}`, { headers });
    return response.json();
  }

  if (toolName === "square_list_catalog") {
    const response = await fetch(`${base}/catalog/list?limit=${limit}`, { headers });
    return response.json();
  }

  throw new Error(`Unknown Square tool: ${toolName}`);
}

async function callGrangouTool(
  toolName: string,
  input: Record<string, unknown>,
  restaurantName: string,
): Promise<unknown> {
  if (toolName === "grangou_get_metrics") {
    const { data: matches } = await mobile
      .from("matches")
      .select("id, status, matched_user_ids, completion_feedback")
      .eq("restaurant_name", restaurantName);

    const allMatches = matches || [];
    const completed = allMatches.filter((m) => m.status === "completed_successful");
    const allUserIds = new Set<string>();
    completed.forEach((m) => (m.matched_user_ids || []).forEach((uid: string) => allUserIds.add(uid)));

    const ratings = allMatches
      .filter((m) => m.completion_feedback?.rating != null)
      .map((m) => Number(m.completion_feedback.rating));
    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

    return {
      totalGrangouGuests: allUserIds.size,
      completedMatches: completed.length,
      totalMatches: allMatches.length,
      averageRating: avgRating,
      totalReviews: ratings.length,
    };
  }

  if (toolName === "grangou_get_recent_experiences") {
    const limit = (input.limit as number) || 10;
    const { data: matches } = await mobile
      .from("matches")
      .select("id, match_type, matched_user_ids, completion_feedback, completed_at, created_at")
      .eq("restaurant_name", restaurantName)
      .not("completion_feedback", "is", null)
      .order("completed_at", { ascending: false })
      .limit(limit);
    return matches || [];
  }

  if (toolName === "grangou_get_peak_hours") {
    const { data: matches } = await mobile
      .from("matches")
      .select("created_at")
      .eq("restaurant_name", restaurantName);

    const hourCounts: Record<number, number> = {};
    (matches || []).forEach((m) => {
      const hour = new Date(m.created_at).getUTCHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    return hourCounts;
  }

  throw new Error(`Unknown Grangou tool: ${toolName}`);
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const user = await authenticate(req);

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

  let body: { message: string; history: { role: string; content: unknown }[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { message, history = [] } = body;

  // Build active tool list based on connected integrations
  const activeTools = [...GRANGOU_TOOLS];
  if (user.stripe_connected && user.stripe_access_token) {
    activeTools.push(...STRIPE_TOOLS);
  }
  if (user.square_connected && user.square_access_token) {
    activeTools.push(...SQUARE_TOOLS);
  }

  // Build system prompt reflecting integration state
  const stripeStatus = user.stripe_connected
    ? "Stripe (connected): payment processing, revenue, charges, customers, refunds, products."
    : "Stripe (not connected): suggest connecting Stripe in the Integrations page for payment insights.";
  const squareStatus = user.square_connected
    ? "Square (connected): POS orders, payments, customers, catalog, locations."
    : "Square (not connected): suggest connecting Square in the Integrations page for in-restaurant sales data.";

  const systemPrompt = `You are Gou, the AI restaurant management copilot for ${user.name} on the Grangou platform.

You have access to the following data sources:
- Grangou Platform (always available): guest match metrics, recent experiences, ratings, peak hours from the Grangou dining app.
- ${stripeStatus}
- ${squareStatus}

Help the restaurant owner understand their business holistically — guest experience, revenue trends, peak times, and operational insights. Be concise, warm, and actionable. Format currency values clearly. When a data source is not connected, briefly explain what insights would become available if they connected it.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        const messages: { role: string; content: unknown }[] = [
          ...history.filter((m) => m.role === "user" || m.role === "assistant"),
          { role: "user", content: message },
        ];

        let continueLoop = true;

        while (continueLoop) {
          const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": anthropicApiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-6",
              max_tokens: 4096,
              system: systemPrompt,
              tools: activeTools,
              messages,
            }),
          });

          const data = await anthropicResponse.json();

          if (!anthropicResponse.ok) {
            emit({ type: "text_delta", text: `Error: ${data.error?.message || "AI service error"}` });
            break;
          }

          // Emit any text blocks
          for (const block of data.content || []) {
            if (block.type === "text" && block.text) {
              emit({ type: "text_delta", text: block.text });
            }
          }

          if (data.stop_reason === "tool_use") {
            messages.push({ role: "assistant", content: data.content });

            const toolResults: {
              type: string;
              tool_use_id: string;
              content: string;
            }[] = [];

            for (const block of data.content || []) {
              if (block.type === "tool_use") {
                emit({ type: "tool_use", tool_name: block.name, tool_use_id: block.id });

                let result: unknown;
                try {
                  if (block.name.startsWith("stripe_")) {
                    result = await callStripeAPI(block.name, block.input || {}, user.stripe_access_token!);
                  } else if (block.name.startsWith("square_")) {
                    result = await callSquareAPI(block.name, block.input || {}, user.square_access_token!);
                  } else if (block.name.startsWith("grangou_")) {
                    result = await callGrangouTool(block.name, block.input || {}, user.name);
                  } else {
                    result = { error: `Unknown tool namespace: ${block.name}` };
                  }
                } catch (err) {
                  result = { error: (err as Error).message };
                }

                emit({ type: "tool_result", tool_use_id: block.id, result });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: JSON.stringify(result),
                });
              }
            }

            messages.push({ role: "user", content: toolResults });
          } else {
            continueLoop = false;
          }
        }
      } catch (err) {
        emit({ type: "text_delta", text: `Sorry, I encountered an error: ${(err as Error).message}` });
      } finally {
        emit({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
