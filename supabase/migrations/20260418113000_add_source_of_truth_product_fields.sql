-- Add source-of-truth columns mapped from public/dane.xlsx headers
-- and translation-capable JSON fields for bilingual product/category content.

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS source_co TEXT,
    ADD COLUMN IF NOT EXISTS source_nazwa TEXT,
    ADD COLUMN IF NOT EXISTS source_opis TEXT,
    ADD COLUMN IF NOT EXISTS source_url_produktu TEXT,
    ADD COLUMN IF NOT EXISTS source_zdjecie_glowne TEXT,
    ADD COLUMN IF NOT EXISTS source_zdjecia_produktu_pozostale TEXT[],
    ADD COLUMN IF NOT EXISTS source_sku_nokaut TEXT,
    ADD COLUMN IF NOT EXISTS source_sku_stan TEXT,
    ADD COLUMN IF NOT EXISTS source_stan INTEGER,
    ADD COLUMN IF NOT EXISTS source_netto NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS source_brutto NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS source_sku_info TEXT,
    ADD COLUMN IF NOT EXISTS source_ena TEXT,
    ADD COLUMN IF NOT EXISTS source_cn TEXT,
    ADD COLUMN IF NOT EXISTS source_waga NUMERIC(10, 3),
    ADD COLUMN IF NOT EXISTS title_translations JSONB,
    ADD COLUMN IF NOT EXISTS description_translations JSONB;

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS name_translations JSONB;

CREATE INDEX IF NOT EXISTS idx_products_source_co ON products(source_co);
CREATE INDEX IF NOT EXISTS idx_products_source_ena ON products(source_ena);
CREATE INDEX IF NOT EXISTS idx_products_source_cn ON products(source_cn);

COMMENT ON COLUMN products.source_co IS 'Excel header: CO';
COMMENT ON COLUMN products.source_nazwa IS 'Excel header: NAZWA';
COMMENT ON COLUMN products.source_opis IS 'Excel header: OPIS';
COMMENT ON COLUMN products.source_url_produktu IS 'Excel header: URL PRODUKTU';
COMMENT ON COLUMN products.source_zdjecie_glowne IS 'Excel header: ZDJĘCIE GŁÓWNE';
COMMENT ON COLUMN products.source_zdjecia_produktu_pozostale IS 'Excel header: ZDJĘCIA PRODUKTU POZOSTŁE';
COMMENT ON COLUMN products.source_sku_nokaut IS 'Excel header: SKU (Nokaut feed)';
COMMENT ON COLUMN products.source_sku_stan IS 'Excel header: SKU (stany.txt feed)';
COMMENT ON COLUMN products.source_stan IS 'Excel header: STAN';
COMMENT ON COLUMN products.source_netto IS 'Excel header: NETTO';
COMMENT ON COLUMN products.source_brutto IS 'Excel header: BRUTTO';
COMMENT ON COLUMN products.source_sku_info IS 'Excel header: SKU (info.txt feed)';
COMMENT ON COLUMN products.source_ena IS 'Excel header: ENA (source naming retained from dane.xlsx)';
COMMENT ON COLUMN products.source_cn IS 'Excel header: CN';
COMMENT ON COLUMN products.source_waga IS 'Excel header: WAGA';
