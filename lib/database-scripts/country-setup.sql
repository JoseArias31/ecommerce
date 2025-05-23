-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  code VARCHAR(2) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  flag VARCHAR(10) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  language VARCHAR(2) NOT NULL,
  flag_image VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to countries table
CREATE TRIGGER update_countries_updated_at
BEFORE UPDATE ON countries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default countries
INSERT INTO countries (code, name, currency, flag, locale, language, flag_image)
VALUES 
  ('CA', 'Canada', 'CAD', '🇨🇦', 'en-CA', 'en', '/flags/Canada.svg.svg'),
  ('CO', 'Colombia', 'COP', '🇨🇴', 'es-CO', 'es', '/flags/colombia.svg')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    currency = EXCLUDED.currency,
    flag = EXCLUDED.flag,
    locale = EXCLUDED.locale,
    language = EXCLUDED.language,
    flag_image = EXCLUDED.flag_image;

-- Add country_availability to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'products'
    AND column_name = 'country_availability'
  ) THEN
    ALTER TABLE products ADD COLUMN country_availability VARCHAR[] DEFAULT ARRAY['CA', 'CO'];
  END IF;
END $$;

-- Create country_availability index for better performance
CREATE INDEX IF NOT EXISTS idx_products_country_availability ON products USING GIN(country_availability);

-- Update existing products to include country availability
-- Assumes you already have products table with at least id column
UPDATE products 
SET country_availability = ARRAY['CA', 'CO']
WHERE country_availability IS NULL;
