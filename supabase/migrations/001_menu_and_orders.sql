-- Menu Items table: restaurants define their menu once
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaraunts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Guest Orders table: log what Grangou guests order per visit
CREATE TABLE IF NOT EXISTS guest_orders (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaraunts(id) ON DELETE CASCADE,
  match_id TEXT,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  ordered_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_guest_orders_restaurant ON guest_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_guest_orders_match ON guest_orders(match_id);
CREATE INDEX IF NOT EXISTS idx_guest_orders_menu_item ON guest_orders(menu_item_id);
