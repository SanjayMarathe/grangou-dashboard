# Square Integration + Gou Copilot Transformation

## Context
The Grangou B2B dashboard already has Stripe Connect OAuth. This plan adds an identical Square OAuth integration and transforms Gou from a Stripe-only financial bot into a full restaurant management copilot with access to Stripe (financial), Square (POS), and Grangou platform data (matches, metrics, guest experiences). Gou will also become always-visible rather than gated behind Stripe being connected.

---

## Files to Change

| File | Change Type |
|------|------------|
| `supabase/migrations/004_add_square_integration.sql` | NEW |
| `.env` | Add Square env vars (placeholders) |
| `supabase/functions/restaurant-data/index.ts` | Add Square connect/disconnect/status endpoints |
| `supabase/functions/restaurant-ai/index.ts` | Major rewrite: new tools, system prompt, remove Stripe gate |
| `src/api.js` | Add `connectSquare`, `disconnectSquare` to `integrationAPI` |
| `src/App.js` | Square UI card, OAuth callback fix, always-visible Gou |

---

## Step 1 — DB Migration (`004_add_square_integration.sql`)

```sql
ALTER TABLE restaraunts
  ADD COLUMN IF NOT EXISTS square_access_token TEXT,
  ADD COLUMN IF NOT EXISTS square_merchant_id TEXT,
  ADD COLUMN IF NOT EXISTS square_connected BOOLEAN DEFAULT FALSE;
```

Deploy: `supabase db push --project-ref vzytbtizaijkyunwxyaz`

---

## Step 2 — `.env` Additions

```
REACT_APP_SQUARE_APP_ID=sandbox-sq0idb-PLACEHOLDER
SQUARE_APP_ID=sandbox-sq0idb-PLACEHOLDER
SQUARE_APP_SECRET=sandbox-sq0csb-PLACEHOLDER
```

Also set `SQUARE_APP_ID` and `SQUARE_APP_SECRET` as Supabase edge function secrets via the dashboard (same limitation as Stripe secrets).

---

## Step 3 — `restaurant-data/index.ts` Changes

**3a. Update `handleGetIntegrations`** — extend SELECT to include Square columns, return:
```typescript
{ stripe: { connected, stripe_user_id }, square: { connected, square_merchant_id } }
```

**3b. Add `handleSquareConnect(restaurantId, code)`**:
- POST to `https://connect.squareup.com/oauth2/token` with `SQUARE_APP_ID`, `SQUARE_APP_SECRET`, `code`
- Store `access_token` → `square_access_token`, `merchant_id` → `square_merchant_id`, `square_connected: true`
- Square API requires header: `Square-Version: 2024-01-18`

**3c. Add `handleSquareDisconnect(restaurantId)`**:
- Null out `square_access_token`, `square_merchant_id`, set `square_connected: false`

**3d. Add routes** (after existing Stripe routes, before the GET-only block):
```typescript
if (path.includes("/integrations/square/connect") && method === "POST")
  → handleSquareConnect
if (path.includes("/integrations/square/disconnect") && method === "DELETE")
  → handleSquareDisconnect
```

---

## Step 4 — `restaurant-ai/index.ts` Major Rewrite

### 4a. Remove Stripe gate
Delete the `if (!user.stripe_connected)` early return. Gou is always accessible.

### 4b. Update auth query
Extend SELECT to also fetch `square_access_token, square_connected`.

### 4c. Add mobile DB client
Add second Supabase client pointing to `fnfeiitawuvgtxfpmmvg` (same pattern as `restaurant-data`) for Grangou tools.

### 4d. Three tool groups

**STRIPE_TOOLS** (existing 6 tools — unchanged):
`stripe_retrieve_balance`, `stripe_list_charges`, `stripe_list_customers`, `stripe_list_payment_intents`, `stripe_list_refunds`, `stripe_list_products`

**SQUARE_TOOLS** (5 new tools):
`square_list_orders`, `square_list_payments`, `square_list_customers`, `square_list_catalog`, `square_get_locations`

**GRANGOU_TOOLS** (3 new tools):
`grangou_get_metrics`, `grangou_get_recent_experiences`, `grangou_get_peak_hours`

### 4e. Dynamic tool list (build at request time)
```typescript
const activeTools = [...GRANGOU_TOOLS]; // Always included
if (user.stripe_connected && user.stripe_access_token) activeTools.push(...STRIPE_TOOLS);
if (user.square_connected && user.square_access_token) activeTools.push(...SQUARE_TOOLS);
```

This prevents Claude from attempting to call unavailable tools.

### 4f. Add `callSquareAPI(toolName, input, squareToken)`
- Base URL: `https://connect.squareup.com/v2/`
- Header: `Square-Version: 2024-01-18`, `Authorization: Bearer {token}`
- `square_list_orders` → POST `/v2/orders/search` (auto-fetches locations if none provided)
- `square_list_payments` → GET `/v2/payments?limit=N`
- `square_list_customers` → GET `/v2/customers?limit=N`
- `square_list_catalog` → GET `/v2/catalog/list?limit=N`
- `square_get_locations` → GET `/v2/locations`

### 4g. Add `callGrangouTool(toolName, input, restaurantName, restaurantId)`
Queries mobile DB directly (no HTTP hop):
- `grangou_get_metrics` → aggregate `matches` table: completed count, unique guests, avg rating
- `grangou_get_recent_experiences` → recent completed matches with feedback
- `grangou_get_peak_hours` → count matches by UTC hour

### 4h. Update tool dispatcher
```typescript
if (tool.startsWith("stripe_")) → callStripeAPI(...)
else if (tool.startsWith("square_")) → callSquareAPI(...)
else if (tool.startsWith("grangou_")) → callGrangouTool(...)
```

### 4i. New system prompt
```
You are Gou, the AI restaurant management copilot for {restaurantName} on the Grangou platform.

Data sources available:
- Grangou Platform (always): guest match metrics, experiences, ratings, peak hours
- Stripe (connected/not connected): payment processing, revenue, charges, customers
- Square (connected/not connected): POS orders, payments, inventory, catalog

Help the owner understand their business holistically. Be concise and actionable.
When a source is disconnected, mention what insights would be unlocked by connecting it.
```

---

## Step 5 — `src/api.js` Changes

Add to `integrationAPI`:
```javascript
connectSquare: (code) => fetchEdge('restaurant-data/integrations/square/connect', {
  method: 'POST', body: JSON.stringify({ code })
}),
disconnectSquare: () => fetchEdge('restaurant-data/integrations/square/disconnect', {
  method: 'DELETE'
}),
```

---

## Step 6 — `src/App.js` Changes

### 6a. New state variables
```javascript
const [squareConnected, setSquareConnected] = useState(false);
const [squareMerchantId, setSquareMerchantId] = useState(null);
```

### 6b. Update `fetchIntegrationStatus`
Read `status.square.connected` and `status.square.square_merchant_id`.

### 6c. Fix OAuth callback `useEffect` — KEY CHANGE
Differentiate Square vs Stripe using the `state` URL parameter:
```javascript
const state = params.get('state');
if (state === 'square_oauth') {
  // → integrationAPI.connectSquare(code)
} else {
  // → integrationAPI.connectStripe(code) [existing behavior]
}
```
Square echoes back the `state` param; Stripe does not send `state=square_oauth`.

### 6d. Square OAuth URL
```javascript
const url = `https://connect.squareup.com/oauth2/authorize
  ?client_id=${process.env.REACT_APP_SQUARE_APP_ID}
  &scope=ORDERS_READ+PAYMENTS_READ+CUSTOMERS_READ+ITEMS_READ+INVENTORY_READ
  &session=false
  &state=square_oauth
  &redirect_uri=${encodeURIComponent(window.location.origin)}`;
```
**Note:** `window.location.origin` must be registered as an allowed redirect URI in the Square Developer Dashboard.

### 6e. Square card in `IntegrationsPage`
Add Square card after the Stripe card, mirroring its structure:
- Connected badge + merchant ID display when connected
- "Connect Square" button (blue `#006AFF`) when not connected
- "Disconnect" button when connected
- Separate `isSquareDisconnecting` state to avoid spinner conflicts
- Square icon: add `public/square.png` or use letter placeholder until asset is available

### 6f. Remove Stripe gate from floating chat button
Change `{stripeConnected && <button...>}` → `<button...>` (always visible)

### 6g. Update `ChatbotPanel`
- Welcome message: "Hi! I'm Gou, your restaurant management copilot. I can help with Grangou guest insights, peak hours, ratings, and more. Connect Stripe or Square in Integrations to unlock financial and POS data!"
- Subtitle: "Restaurant Management Copilot"
- Input placeholder: "Ask about your restaurant..."
- Expand `toolLabels` map to include all 14 tools (6 Stripe + 5 Square + 3 Grangou)

### 6h. Pass Square props to `IntegrationsPage` at call site
```jsx
<IntegrationsPage
  stripeConnected={stripeConnected} stripeUserId={stripeUserId}
  onStripeDisconnect={() => { setStripeConnected(false); setStripeUserId(null); }}
  squareConnected={squareConnected} squareMerchantId={squareMerchantId}
  onSquareDisconnect={() => { setSquareConnected(false); setSquareMerchantId(null); }}
/>
```

---

## Implementation Order

1. Run migration SQL
2. Set Square secrets in Supabase dashboard
3. Deploy `restaurant-data/index.ts`
4. Deploy `restaurant-ai/index.ts`
5. Update `.env` with Square placeholders
6. Update `src/api.js`
7. Update `src/App.js`
8. `npm run build` and test

---

## Verification

1. **Integrations page** shows both Stripe and Square cards
2. **Square OAuth flow**: clicking "Connect Square" redirects to Square, callback correctly sets `squareConnected=true`
3. **Stripe OAuth unaffected**: existing Stripe connect flow still works
4. **Gou always visible**: chat button appears even when no integration is connected
5. **Gou with no integrations**: responds using Grangou platform data only, suggests connecting Stripe/Square
6. **Gou with Square connected**: can answer POS questions (orders, payments, catalog)
7. **Gou with Stripe connected**: can answer financial questions (same as before)
8. **Gou with both connected**: can answer across all three data sources
