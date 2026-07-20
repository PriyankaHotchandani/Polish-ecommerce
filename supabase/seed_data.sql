-- Seed Data for E-commerce Platform Testing
-- BM SP. Z O.O. - Test Data

-- =====================================================
-- INSERT CATEGORIES
-- =====================================================
INSERT INTO categories (id, name, slug, parent_id) VALUES
    ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Kitchenware', 'kitchenware', NULL),
    ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Power Tools', 'power-tools', NULL);

-- =====================================================
-- INSERT HOUSEHOLD PRODUCTS (Kitchenware)
-- =====================================================
INSERT INTO products (id, sku, title, slug, brand, description, price_retail, price_wholesale, inventory_count, category_id, specifications, image_urls) VALUES
    (
        'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
        'KW-KETTLE-001',
        'Premium Stainless Steel Electric Kettle',
        'premium-stainless-steel-electric-kettle',
        'Kinghoff',
        'High-quality stainless steel electric kettle with rapid boil technology and automatic shut-off. Perfect for tea and coffee lovers.',
        147.69,
        120.00,
        45,
        'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        '{"capacity": "1.7L", "power": "2200W", "material": "Stainless Steel", "features": ["Auto shut-off", "Boil-dry protection", "360° base"], "weight": "1.2kg", "color": "Silver"}'::jsonb,
        ARRAY['https://images.pexels.com/photos/8879615/pexels-photo-8879615.jpeg', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800', 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800']
    ),
    (
        'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
        'KW-PAN-002',
        'Non-Stick Ceramic Frying Pan 28cm',
        'non-stick-ceramic-frying-pan-28cm',
        'Klausberg',
        'Professional-grade ceramic non-stick frying pan. PFOA-free coating, suitable for all stovetops including induction.',
        98.40,
        80.00,
        62,
        'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        '{"diameter": "28cm", "material": "Aluminum with ceramic coating", "coating": "PFOA-free ceramic", "compatibility": ["Gas", "Electric", "Induction", "Ceramic"], "weight": "890g", "color": "Black"}'::jsonb,
        ARRAY['https://images.pexels.com/photos/29462835/pexels-photo-29462835.jpeg', 'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800']
    ),
    (
        'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
        'KW-KNIFE-003',
        'Professional 5-Piece Kitchen Knife Set',
        'professional-5-piece-kitchen-knife-set',
        'Kassel',
        'Premium German stainless steel knife set with ergonomic handles. Includes chef knife, bread knife, utility knife, paring knife, and wooden block.',
        221.40,
        180.00,
        28,
        'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        '{"pieces": 5, "blade_material": "German Stainless Steel", "hardness": "HRC 56-58", "handle_material": "Pakkawood", "includes": ["Chef Knife 20cm", "Bread Knife 20cm", "Utility Knife 13cm", "Paring Knife 9cm", "Wooden Block"], "dishwasher_safe": false}'::jsonb,
        ARRAY['https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800', 'https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=800', 'https://images.unsplash.com/photo-1621830090958-299ed88e4456?w=800']
    ),
    (
        'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
        'KW-BLEND-004',
        'High-Speed Smoothie Blender 1200W',
        'high-speed-smoothie-blender-1200w',
        'Alpenburg',
        'Powerful 1200W motor blender with 6 stainless steel blades. Perfect for smoothies, soups, and nut butters. BPA-free jug.',
        184.50,
        150.00,
        34,
        'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        '{"power": "1200W", "capacity": "2.0L", "speed_settings": 10, "blade_count": 6, "material": "BPA-free Tritan plastic", "features": ["Pulse function", "Ice crushing", "Self-cleaning"], "color": "Black/Silver"}'::jsonb,
        ARRAY['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800', 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=800']
    ),
    (
        'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
        'KW-PRESS-005',
        'French Press Coffee Maker 1L',
        'french-press-coffee-maker-1l',
        'Kinghoff',
        'Classic French press coffee maker with heat-resistant borosilicate glass and stainless steel frame. Makes 8 cups of rich coffee.',
        73.80,
        60.00,
        78,
        'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        '{"capacity": "1L", "servings": 8, "glass_type": "Borosilicate", "frame_material": "Stainless Steel", "filter_type": "3-layer stainless steel mesh", "dishwasher_safe": true, "color": "Silver"}'::jsonb,
        ARRAY['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800', 'https://images.unsplash.com/photo-1611564359818-5b8d5d5f9bfc?w=800']
    );

-- =====================================================
-- INSERT TOOL PRODUCTS (Power Tools)
-- =====================================================
INSERT INTO products (id, sku, title, slug, brand, description, price_retail, price_wholesale, inventory_count, category_id, specifications, image_urls) VALUES
    (
        'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
        'PT-DRILL-101',
        'Cordless Drill Driver 18V Li-Ion',
        'cordless-drill-driver-18v-li-ion',
        'Kraft&Dele',
        'Professional 18V cordless drill with brushless motor. Includes 2 lithium-ion batteries, charger, and carry case. 60Nm torque.',
        369.00,
        300.00,
        52,
        'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        '{"voltage": "18V", "battery_type": "Li-Ion", "battery_capacity": "2.0Ah", "batteries_included": 2, "torque": "60Nm", "chuck_size": "13mm", "speed_settings": 2, "max_speed": "1800 RPM", "features": ["LED work light", "Brushless motor", "Belt clip"], "weight": "1.6kg"}'::jsonb,
        ARRAY['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800', 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800']
    ),
    (
        'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
        'PT-GRIND-102',
        'Angle Grinder 125mm 900W',
        'angle-grinder-125mm-900w',
        'W.D.S',
        'Compact and powerful 125mm angle grinder with 900W motor. Ideal for cutting, grinding, and polishing metal and stone.',
        147.69,
        120.00,
        41,
        'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        '{"power": "900W", "disc_diameter": "125mm", "spindle_thread": "M14", "no_load_speed": "11000 RPM", "safety_features": ["Restart protection", "Safety guard", "Spindle lock"], "cable_length": "2.5m", "weight": "2.0kg"}'::jsonb,
        ARRAY['https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800', 'https://images.unsplash.com/photo-1590839116008-7ed3cd4f6ab5?w=800']
    ),
    (
        'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
        'PT-HAMMER-103',
        'Rotary Hammer Drill SDS-Plus 800W',
        'rotary-hammer-drill-sds-plus-800w',
        'Kraft&Dele',
        'Heavy-duty SDS-Plus rotary hammer drill for concrete, masonry, and stone. 3 modes: drilling, hammer drilling, and chiseling.',
        430.50,
        350.00,
        23,
        'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        '{"power": "800W", "chuck_type": "SDS-Plus", "impact_energy": "2.7J", "drilling_capacity_concrete": "26mm", "modes": 3, "mode_types": ["Drilling", "Hammer drilling", "Chiseling"], "vibration_control": true, "weight": "2.8kg"}'::jsonb,
        ARRAY['https://images.unsplash.com/photo-1530539595977-0aa9890547c4?w=800', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800']
    ),
    (
        'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
        'PT-SAW-104',
        'Circular Saw 190mm 1400W',
        'circular-saw-190mm-1400w',
        'Alpenburg',
        'Professional circular saw with 1400W motor and 190mm blade. Laser guide and adjustable depth and bevel angle up to 45°.',
        258.30,
        210.00,
        36,
        'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        '{"power": "1400W", "blade_diameter": "190mm", "cutting_depth_90deg": "66mm", "cutting_depth_45deg": "48mm", "no_load_speed": "5500 RPM", "features": ["Laser guide", "Dust extraction", "Parallel guide"], "bevel_adjustment": "0-45°", "weight": "4.2kg"}'::jsonb,
        ARRAY['https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800']
    ),
    (
        'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c',
        'PT-SAND-105',
        'Orbital Sander 300W with Dust Collection',
        'orbital-sander-300w-with-dust-collection',
        'W.D.S',
        'Ergonomic orbital sander with micro dust filtration system. Variable speed control for precise sanding on wood, metal, and plastic.',
        184.50,
        150.00,
        47,
        'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        '{"power": "300W", "pad_size": "125mm", "orbit_diameter": "2.0mm", "oscillation_rate": "7000-12000 OPM", "speed_control": "Variable", "dust_collection": "Integrated micro-filter", "paper_attachment": "Hook and loop", "weight": "1.3kg"}'::jsonb,
        ARRAY['https://images.unsplash.com/photo-1581094651181-35942459ef62?w=800', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800', 'https://images.unsplash.com/photo-1590839116008-7ed3cd4f6ab5?w=800']
    );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment to verify data after insertion:
-- SELECT COUNT(*) as category_count FROM categories;
-- SELECT COUNT(*) as product_count FROM products;
-- SELECT c.name, COUNT(p.id) as product_count 
-- FROM categories c 
-- LEFT JOIN products p ON c.id = p.category_id 
-- GROUP BY c.name;
