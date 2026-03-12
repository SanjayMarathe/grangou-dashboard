import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// B2B database (grangou website)
const b2bUrl = Deno.env.get("SUPABASE_URL")!;
const b2bKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const b2b = createClient(b2bUrl, b2bKey);

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

async function authenticate(req: Request): Promise<{ id: number; name: string; email: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const payload = decodeToken(authHeader.substring(7));
  if (!payload || !payload.userId) return null;

  const { data } = await b2b
    .from("restaraunts")
    .select("id, name, email, stripe_access_token, stripe_connected")
    .eq("id", payload.userId)
    .single();

  return data;
}

// ============================================
// STRIPE TOOL DEFINITIONS
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

// ============================================
// STRIPE API CALLER
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
  if (!url) throw new Error(`Unknown tool: ${toolName}`);

  const response = await fetch(url, { headers });
  return response.json();
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const user = await authenticate(req) as (
    { id: number; name: string; email: string; stripe_access_token?: string; stripe_connected?: boolean } | null
  );

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!user.stripe_connected || !user.stripe_access_token) {
    return new Response(JSON.stringify({ error: "Stripe not connected" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripeToken = user.stripe_access_token;
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
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // Build initial message list (filter to valid roles only)
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
              system: `You are Gou, an AI financial assistant for ${user.name} restaurant on the Grangou platform. You have access to the restaurant's Stripe account. Help them understand their revenue, charges, customers, and financial performance. Be concise and helpful. Format currency values clearly.`,
              tools: STRIPE_TOOLS,
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
            // Add assistant message with all content blocks
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
                  result = await callStripeAPI(block.name, block.input || {}, stripeToken);
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
            // end_turn or other stop reason — done
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
