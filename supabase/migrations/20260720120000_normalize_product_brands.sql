-- Normalize product brands to the canonical Polish/European brand catalog.
-- Tools and Equipment: Kraft&Dele, W.D.S, Alpenburg
-- Household:           Kinghoff, Klausberg, Kassel, Alpenburg
-- Spelling and capitalization here are canonical and must match the UI filter
-- options exactly (see utils/brands.ts). Applied to the hosted database on
-- 2026-07-20; kept here so other environments converge to the same values.

-- Fix casing of existing tool brands
UPDATE products SET brand = 'Kraft&Dele' WHERE brand ILIKE 'kraft&dele' AND brand <> 'Kraft&Dele';
UPDATE products SET brand = 'W.D.S'      WHERE brand ILIKE 'w.d.s'      AND brand <> 'W.D.S';
UPDATE products SET brand = 'Alpenburg'  WHERE brand ILIKE 'alpenburg'  AND brand <> 'Alpenburg';

-- Backfill household brands from product titles where brand is missing
UPDATE products SET brand = 'Kinghoff'  WHERE brand IS NULL AND title ILIKE '%kinghoff%';
UPDATE products SET brand = 'Klausberg' WHERE brand IS NULL AND title ILIKE '%klausberg%';
UPDATE products SET brand = 'Kassel'    WHERE brand IS NULL AND title ILIKE '%kassel%';

-- Backfill from manufacturer product codes (KH-#### = Kinghoff, KB-#### = Klausberg)
UPDATE products SET brand = 'Kinghoff'  WHERE brand IS NULL AND title ~* '\mKH-?\s?\d';
UPDATE products SET brand = 'Klausberg' WHERE brand IS NULL AND title ~* '\mKB-?\s?\d';

-- Fix casing of any legacy household brand values
UPDATE products SET brand = 'Kinghoff'  WHERE brand ILIKE 'kinghoff'  AND brand <> 'Kinghoff';
UPDATE products SET brand = 'Klausberg' WHERE brand ILIKE 'klausberg' AND brand <> 'Klausberg';
UPDATE products SET brand = 'Kassel'    WHERE brand ILIKE 'kassel'    AND brand <> 'Kassel';
