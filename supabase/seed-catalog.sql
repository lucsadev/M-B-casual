-- =============================================================
-- M&B Trend — Catalog Seed Data
-- Description: Sample categories, products, and variants for
--              development and testing.
-- Fase 1: Catalog — Foundation
-- =============================================================

-- =============================================================
-- 1. CATEGORIES
-- =============================================================
insert into categories (id, name, slug, description, sort_order) values
  (
    'c0000000-0000-0000-0000-000000000001',
    'Mujer',
    'mujer',
    'Indumentaria y accesorios para mujer',
    1
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'Hombre',
    'hombre',
    'Indumentaria y accesorios para hombre',
    2
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'Accesorios',
    'accesorios',
    'Complementos y accesorios de moda',
    3
  );

-- =============================================================
-- 2. PRODUCTS (Mujer)
-- =============================================================
insert into products (id, category_id, name, slug, description, price, images, tags, is_active) values
  (
    'p0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Camisa Oversize Blanca',
    'camisa-oversize-blanca',
    'Camisa de corte oversize en algodón premium. Ideal para looks casuales y elegantes.',
    18900,
    '{"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600"}',
    '{nuevo, destacado}',
    true
  ),
  (
    'p0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'Vestido Midax Negro',
    'vestido-midax-negro',
    'Vestido midi corte recto en crepe negro. Elegante y versátil.',
    25900,
    '{"https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600"}',
    '{destacado}',
    true
  ),
  (
    'p0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'Blazer Beige',
    'blazer-beige',
    'Blazer entallado en tono beige. Perfecto para la oficina o salidas.',
    35900,
    '{"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600"}',
    '{destacado}',
    true
  ),
  (
    'p0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'Remón Básico Algodón',
    'remon-basico-algodon',
    'Remón mangas cortas en algodón peinado. Imprescindible en tu guardarropa.',
    8900,
    '{"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600"}',
    '{}',
    true
  ),
  (
    'p0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000001',
    'Pollera Tabla Marfil',
    'pollera-tabla-marfil',
    'Pollera con tabla en frente y cierre trasero. Tiro medio.',
    15900,
    '{"https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600"}',
    '{nuevo}',
    true
  );

-- =============================================================
-- 3. PRODUCTS (Hombre)
-- =============================================================
insert into products (id, category_id, name, slug, description, price, images, tags, is_active) values
  (
    'p0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000002',
    'Camisa Slim Fit Celeste',
    'camisa-slim-fit-celeste',
    'Camisa manga larga corte slim fit. Ideal para eventos formales.',
    17900,
    '{"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600"}',
    '{destacado}',
    true
  ),
  (
    'p0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000002',
    'Chomba Lacoste Blanca',
    'chomba-lacoste-blanca',
    'Chomba clásica con cuello. Algodón piqué de alta calidad.',
    12900,
    '{"https://images.unsplash.com/photo-1593030761757-71fae45fa0e2?w=600"}',
    '{}',
    true
  ),
  (
    'p0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000002',
    'Jean Recto Clásico',
    'jean-recto-clasico',
    'Jean de corte recto en denim índigo. Clásico de toda la vida.',
    19900,
    '{"https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600"}',
    '{destacado, oferta}',
    true
  );

-- =============================================================
-- 4. PRODUCTS (Accesorios)
-- =============================================================
insert into products (id, category_id, name, slug, description, price, images, tags, is_active) values
  (
    'p0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000003',
    'Cinto Cuero Negro',
    'cinto-cuero-negro',
    'Cinto de cuero genuino con hebilla dorada. Ancho 3cm.',
    8900,
    '{"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"}',
    '{nuevo}',
    true
  ),
  (
    'p0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000003',
    'Cartera Bandolera Marrón',
    'cartera-bandolera-marron',
    'Bandolera de cuero sintético con compartimentos. Tamaño medio.',
    24500,
    '{"https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600"}',
    '{destacado, oferta}',
    true
  );

-- =============================================================
-- 5. VARIANTS
-- =============================================================
-- Camisa Oversize Blanca — 3 talles
insert into product_variants (product_id, size, color, color_hex, stock, sku) values
  ('p0000000-0000-0000-0000-000000000001', 'S', 'Blanco', '#FFFFFF', 10, 'CAM-OVS-S'),
  ('p0000000-0000-0000-0000-000000000001', 'M', 'Blanco', '#FFFFFF', 15, 'CAM-OVS-M'),
  ('p0000000-0000-0000-0000-000000000001', 'L', 'Blanco', '#FFFFFF', 5, 'CAM-OVS-L');

-- Vestido Midax Negro — 3 talles
insert into product_variants (product_id, size, color, color_hex, stock, sku) values
  ('p0000000-0000-0000-0000-000000000002', 'S', 'Negro', '#1A1A1A', 8, 'VES-MID-S'),
  ('p0000000-0000-0000-0000-000000000002', 'M', 'Negro', '#1A1A1A', 12, 'VES-MID-M'),
  ('p0000000-0000-0000-0000-000000000002', 'L', 'Negro', '#1A1A1A', 6, 'VES-MID-L');

-- Blazer Beige — 3 talles
insert into product_variants (product_id, size, color, color_hex, stock, sku) values
  ('p0000000-0000-0000-0000-000000000003', 'S', 'Beige', '#E8E4D9', 7, 'BLA-BEI-S'),
  ('p0000000-0000-0000-0000-000000000003', 'M', 'Beige', '#E8E4D9', 9, 'BLA-BEI-M'),
  ('p0000000-0000-0000-0000-000000000003', 'L', 'Beige', '#E8E4D9', 4, 'BLA-BEI-L');

-- Remón Básico — 4 talles
insert into product_variants (product_id, size, color, color_hex, stock, sku) values
  ('p0000000-0000-0000-0000-000000000004', 'S', 'Negro', '#1A1A1A', 20, 'REM-BAS-S'),
  ('p0000000-0000-0000-0000-000000000004', 'M', 'Negro', '#1A1A1A', 25, 'REM-BAS-M'),
  ('p0000000-0000-0000-0000-000000000004', 'L', 'Negro', '#1A1A1A', 18, 'REM-BAS-L'),
  ('p0000000-0000-0000-0000-000000000004', 'XL', 'Negro', '#1A1A1A', 10, 'REM-BAS-XL');

-- Pollera Tabla Marfil — 2 talles
insert into product_variants (product_id, size, color, color_hex, stock, sku) values
  ('p0000000-0000-0000-0000-000000000005', 'S', 'Marfil', '#FFFFF7', 6, 'POL-TAB-S'),
  ('p0000000-0000-0000-0000-000000000005', 'M', 'Marfil', '#FFFFF7', 8, 'POL-TAB-M');

-- Camisa Slim Fit Celeste — 3 talles
insert into product_variants (product_id, size, color, color_hex, stock, sku) values
  ('p0000000-0000-0000-0000-000000000006', 'S', 'Celeste', '#87CEEB', 12, 'CAM-SLI-S'),
  ('p0000000-0000-0000-0000-000000000006', 'M', 'Celeste', '#87CEEB', 14, 'CAM-SLI-M'),
  ('p0000000-0000-0000-0000-000000000006', 'L', 'Celeste', '#87CEEB', 8, 'CAM-SLI-L');

-- Chomba Lacoste Blanca — 3 talles
insert into product_variants (product_id, size, color, color_hex, stock, sku) values
  ('p0000000-0000-0000-0000-000000000007', 'M', 'Blanco', '#FFFFFF', 15, 'CHO-LAC-M'),
  ('p0000000-0000-0000-0000-000000000007', 'L', 'Blanco', '#FFFFFF', 12, 'CHO-LAC-L'),
  ('p0000000-0000-0000-0000-000000000007', 'XL', 'Blanco', '#FFFFFF', 6, 'CHO-LAC-XL');

-- Jean Recto Clásico — 4 talles
insert into product_variants (product_id, size, color, color_hex, stock, sku) values
  ('p0000000-0000-0000-0000-000000000008', 'S', 'Índigo', '#3F51B5', 10, 'JEA-REC-S'),
  ('p0000000-0000-0000-0000-000000000008', 'M', 'Índigo', '#3F51B5', 18, 'JEA-REC-M'),
  ('p0000000-0000-0000-0000-000000000008', 'L', 'Índigo', '#3F51B5', 12, 'JEA-REC-L'),
  ('p0000000-0000-0000-0000-000000000008', 'XL', 'Índigo', '#3F51B5', 5, 'JEA-REC-XL');

-- Cinto Cuero Negro — único talle
insert into product_variants (product_id, size, color, color_hex, stock, sku) values
  ('p0000000-0000-0000-0000-000000000009', 'Único', 'Negro', '#1A1A1A', 20, 'CIN-CUE-UNI');

-- Cartera Bandolera — única
insert into product_variants (product_id, size, color, color_hex, stock, sku) values
  ('p0000000-0000-0000-0000-000000000010', 'Único', 'Marrón', '#8B4513', 8, 'CAR-BAN-UNI');
