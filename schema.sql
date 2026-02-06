-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/tzpxoushxkfjqxgyxfxi/sql)

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image_data TEXT, -- Stores Base64 string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Optional, but recommended. For now, we'll keep it simple)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read" ON products FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert" ON products FOR INSERT WITH CHECK (true);
