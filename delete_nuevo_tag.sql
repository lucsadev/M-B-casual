-- ============================================================================
-- Script: Eliminar el tag "nuevo" de todos los productos
-- Descripción: Remueve el tag "nuevo" (case-insensitive) de la columna tags
-- de la tabla products. Si el tag no existe en un producto, esa fila se omite.
-- ============================================================================

-- Paso 1: Verificar qué productos tienen el tag "nuevo" antes de eliminarlo
SELECT
  id,
  name,
  slug,
  tags
FROM products
WHERE 'nuevo' = ANY(tags);

-- Paso 2: Eliminar el tag "nuevo" de todos los productos que lo tienen
-- Usamos array_remove para quitar el valor del array.
-- Nota: La comparación ANY(tags) es sensible a mayúsculas/minúsculas.
-- Si tus tags están en minúsculas ('nuevo'), esta sentencia los quitará exactos.
-- Si tienes 'Nuevo' con mayúscula, usa la versión con lower() abajo.
UPDATE products
SET tags = array_remove(tags, 'nuevo')
WHERE 'nuevo' = ANY(tags);

-- Opcional: Si quieres una eliminación estrictamente case-insensitive (quita tanto 'nuevo' como 'Nuevo'),
-- descomenta y ejecuta este bloque en su lugar:
--
-- UPDATE products
-- SET tags = (
--   select array_agg(distinct tag)
--   from unnest(tags) as tag
--   where lower(tag) <> 'nuevo'
-- )
-- WHERE EXISTS (
--   select 1
--   from unnest(tags) as tag
--   where lower(tag) = 'nuevo'
-- );

-- Verificación final: confirmar que ya no hay productos con el tag "nuevo"
SELECT
  count(*) as total_productos,
  count(*) FILTER (WHERE 'nuevo' = ANY(tags)) as productos_con_nuevo
FROM products;

-- Mensaje de conclusión
SELECT
  case
    when count(*) FILTER (WHERE 'nuevo' = ANY(tags)) = 0 then
      '✅ El tag "nuevo" ha sido eliminado de todos los productos.'
    else
      '⚠️ Quedan ' || count(*) FILTER (WHERE 'nuevo' = ANY(tags)) || ' productos con el tag "nuevo".'
  end as resultado
FROM products;