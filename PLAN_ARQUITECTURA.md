# Plan de Arquitectura — M&B Trend

**Versión:** 1.0  
**Fecha:** 7 de julio de 2026  
**Stack:** React Native (mobile) + React/Vite (web) + Supabase (backend)

---

## Índice

1. [Visión general](#1-visión-general)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Stack técnico detallado](#3-stack-técnico-detallado)
4. [Base de datos — Supabase](#4-base-de-datos--supabase)
5. [Autenticación y RLS](#5-autenticación-y-rls)
6. [Arquitectura del frontend compartido](#6-arquitectura-del-frontend-compartido)
7. [Aplicación Web (React + Vite)](#7-aplicación-web-react--vite)
8. [Aplicación Mobile (React Native)](#8-aplicación-mobile-react-native)
9. [Módulo de administración](#9-módulo-de-administración)
10. [Módulo financiero](#10-módulo-financiero)
11. [Integraciones](#11-integraciones)
12. [Almacenamiento de imágenes](#12-almacenamiento-de-imágenes)
13. [Plan de implementación por fases](#13-plan-de-implementación-por-fases)
14. [Costos estimados de infraestructura](#14-costos-estimados-de-infraestructura)

---

## 1. Visión general

M&B Trend necesita dos aplicaciones que comparten la misma base de datos y lógica de negocio en Supabase:

- **App Mobile (React Native)**: orientada a clientes finales. Catálogo, carrito, compras, seguimiento de pedidos.
- **App Web (React + Vite)**: doble propósito — tienda online para clientes + panel de administración para Marianela y Belén.

Ambas consumen la misma API de Supabase (cliente directo con RLS + Edge Functions para lógica sensible).

### Principios de arquitectura

- **Código compartido**: las reglas de negocio, tipos y lógica de validación viven en un paquete compartido.
- **Autenticación unificada**: Supabase Auth provee sesión tanto en web como en mobile.
- **RLS first**: la seguridad se define a nivel de base de datos, no en el cliente.
- **Offline-first (mobile)**: la app mobile debe funcionar con datos cacheados cuando no hay conexión.

---

## 2. Estructura del proyecto

```
m&b/
├── packages/
│   ├── shared/              # Código compartido (tipos, validaciones, utils)
│   │   ├── src/
│   │   │   ├── types/       # Interfaces y tipos compartidos
│   │   │   ├── validators/  # Esquemas de validación (zod)
│   │   │   ├── constants/   # Constantes (categorías, colores, etc.)
│   │   │   └── utils/       # Funciones de utilidad
│   │   └── package.json
│   │
│   ├── web/                 # App web (React + Vite)
│   │   ├── src/
│   │   │   ├── app/         # Configuración de router y providers
│   │   │   ├── pages/       # Páginas (routing)
│   │   │   ├── features/    # Módulos funcionales
│   │   │   │   ├── catalog/
│   │   │   │   ├── cart/
│   │   │   │   ├── checkout/
│   │   │   │   ├── auth/
│   │   │   │   ├── admin/   # Panel admin
│   │   │   │   └── finance/ # Módulo financiero
│   │   │   ├── components/  # Componentes compartidos (UI)
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── lib/         # Clientes Supabase, config, etc.
│   │   │   └── styles/      # Estilos globales y tema
│   │   ├── index.html
│   │   └── package.json
│   │
│   └── mobile/              # App mobile (React Native)
│       ├── src/
│       │   ├── app/         # Navigation y providers
│       │   ├── screens/     # Pantallas
│       │   ├── features/    # Módulos funcionales
│       │   │   ├── catalog/
│       │   │   ├── cart/
│       │   │   ├── checkout/
│       │   │   └── auth/
│       │   ├── components/  # Componentes UI nativos
│       │   ├── hooks/
│       │   ├── lib/         # Cliente Supabase, cache, etc.
│       │   └── styles/      # Tema y estilos
│       ├── App.tsx
│       └── package.json
│
├── supabase/
│   ├── migrations/          # Migraciones SQL
│   ├── seed.sql             # Datos de semilla
│   ├── functions/           # Edge Functions
│   │   └── payments/        # Ej: procesar pago
│   └── config.toml          # Configuración de Supabase
│
├── PLAND_ARQUITECTURA.md    # Este archivo
└── package.json             # Root (workspaces)
```

---

## 3. Stack técnico detallado

### Compartido

| Herramienta     | Versión | Propósito                          |
| --------------- | ------- | ---------------------------------- |
| TypeScript      | 5.x     | Tipado en toda la base             |
| pnpm workspaces | —       | Monorepo                           |
| Zod             | 3.x     | Validación de esquemas compartidos |
| Supabase JS     | 2.x     | Cliente de base de datos           |

### Web (React + Vite)

| Herramienta      | Propósito                   |
| ---------------- | --------------------------- |
| React 18+        | UI                          |
| Vite 5+          | Build tool                  |
| React Router v6+ | Routing                     |
| TanStack Query   | Cache y estado del servidor |
| Tailwind CSS v4  | Estilos                     |
| shadcn/ui        | Componentes de UI base      |

### Mobile (React Native)

| Herramienta        | Propósito                   |
| ------------------ | --------------------------- |
| React Native 0.76+ | UI nativa                   |
| Expo SDK 52+       | Toolchain y módulos nativos |
| Expo Router        | Routing (file-based)        |
| TanStack Query     | Cache y estado del servidor |
| NativeWind v5      | Estilos (Tailwind para RN)  |
| MMKV               | Almacenamiento local rápido |
| NetInfo            | Detección de conectividad   |

### Backend (Supabase)

| Producto       | Propósito                          |
| -------------- | ---------------------------------- |
| Postgres       | Base de datos relacional           |
| Auth           | Registro, login, sesiones          |
| Storage        | Imágenes de productos              |
| Edge Functions | Lógica de servidor (pagos, notifs) |
| Realtime       | Notificaciones en vivo (opcional)  |

---

## 4. Base de datos — Supabase

### Esquema general

```sql
-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================
-- CATEGORÍAS
-- ============================================
create table categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,              -- 'mujer', 'hombre', 'accesorios'
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================
-- PRODUCTOS
-- ============================================
create table products (
  id            uuid primary key default uuid_generate_v4(),
  category_id   uuid not null references categories(id),
  name          text not null,
  slug          text not null unique,
  description   text,
  price         numeric(10,2) not null,
  compare_price numeric(10,2),            -- Precio anterior (para mostrar descuento)
  images        text[],                   -- URLs de imágenes en Supabase Storage
  tags          text[],                   -- ['nuevo', 'destacado', 'oferta']
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================
-- VARIANTES (talle, color)
-- ============================================
create table product_variants (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  size       text,                       -- 'S', 'M', 'L', 'XL', 'Único'
  color      text,                       -- 'Negro', 'Marfil', 'Beige'
  color_hex  text,                       -- '#000000' para mostrar swatch
  stock      int not null default 0,
  sku        text unique,                -- Código interno
  created_at timestamptz not null default now()
);

-- ============================================
-- CLIENTES (datos extra además de auth.users)
-- ============================================
create table customers (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid unique references auth.users(id) on delete cascade,
  first_name  text not null,
  last_name   text,
  phone       text,
  address     jsonb,                     -- Dirección flexible
  created_at  timestamptz not null default now()
);

-- ============================================
-- ÓRDENES
-- ============================================
create type order_status as enum (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
);

create table orders (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid not null references customers(id),
  status          order_status not null default 'pending',
  total           numeric(10,2) not null,
  shipping_cost   numeric(10,2) not null default 0,
  discount        numeric(10,2) not null default 0,
  payment_method  text,                   -- 'transferencia', 'efectivo', 'mp'
  payment_status  text not null default 'pending', -- 'pending', 'paid', 'refunded'
  notes           text,
  shipping_address jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid not null references products(id),
  variant_id  uuid references product_variants(id),
  quantity    int not null,
  unit_price  numeric(10,2) not null,
  subtotal    numeric(10,2) not null
);

-- ============================================
-- COMPRAS A PROVEEDORES
-- ============================================
create table purchases (
  id              uuid primary key default uuid_generate_v4(),
  supplier_name   text not null,
  invoice_number  text,
  total           numeric(10,2) not null,
  notes           text,
  purchase_date   date not null default current_date,
  created_at      timestamptz not null default now()
);

create table purchase_items (
  id          uuid primary key default uuid_generate_v4(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id  uuid not null references products(id),
  variant_id  uuid references product_variants(id),
  quantity    int not null,
  unit_cost   numeric(10,2) not null,
  subtotal    numeric(10,2) not null
);

-- ============================================
-- GASTOS OPERATIVOS
-- ============================================
create table expenses (
  id           uuid primary key default uuid_generate_v4(),
  description  text not null,
  amount       numeric(10,2) not null,
  category     text not null,            -- 'publicidad', 'packaging', 'envío', etc.
  expense_date date not null default current_date,
  receipt_url  text,                     -- Foto del comprobante
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

-- ============================================
-- CAJA / MOVIMIENTOS FINANCIEROS
-- ============================================
create table cash_movements (
  id            uuid primary key default uuid_generate_v4(),
  type          text not null check (type in ('income', 'expense')),
  amount        numeric(10,2) not null,
  description   text not null,
  reference_type text,                   -- 'order', 'expense', 'purchase', 'transfer'
  reference_id  uuid,                    -- ID de la orden/gasto/compra asociada
  movement_date date not null default current_date,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
```

### Vistas útiles

```sql
-- Dashboard: ventas del mes
create view monthly_sales as
select
  date_trunc('month', created_at) as month,
  count(*) as total_orders,
  sum(total) as revenue,
  avg(total) as avg_ticket
from orders
where status = 'delivered'
group by month
order by month desc;

-- Stock bajo (menos de 5 unidades)
create view low_stock as
select
  p.name as product_name,
  pv.size,
  pv.color,
  pv.stock
from product_variants pv
join products p on p.id = pv.product_id
where pv.stock < 5 and p.is_active = true
order by pv.stock asc;
```

---

## 5. Autenticación y RLS

### Roles

| Rol       | Acceso                                       |
| --------- | -------------------------------------------- |
| `cliente` | Catálogo, carrito, órdenes propias           |
| `admin`   | Todo: productos, órdenes, finanzas, clientes |

### Políticas RLS por tabla

```sql
-- PRODUCTOS: todos ven activos, solo admin escribe
create policy "Productos visibles para todos"
  on products for select
  using (is_active = true);

create policy "Admin puede gestionar productos"
  on products for all
  using (auth.role() = 'authenticated' and auth.jwt()->>'role' = 'admin');

-- ÓRDENES: clientes ven las suyas, admin ve todas
create policy "Clientes ven sus órdenes"
  on orders for select
  using (
    auth.uid() = customer_id
    or auth.jwt()->>'role' = 'admin'
  );

-- FINANZAS: solo admin
create policy "Solo admin ve finanzas"
  on cash_movements for all
  using (auth.jwt()->>'role' = 'admin');
```

### Flujo de autenticación

- **Web**: Supabase Auth con magic link o email/password. Sesión vía cookies.
- **Mobile**: Supabase Auth con el mismo método. Sesión vía almacenamiento seguro (Expo SecureStore).

---

## 6. Arquitectura del frontend compartido

### Capas

```
pages/screens        → layouts y composición de features
features/            → módulos autónomos (cada uno con sus componentes, hooks, api)
components/ui        → componentes de UI atómicos (Button, Card, Input)
lib/                 → cliente Supabase, config, utilities
```

### Principios

- Cada feature es autocontenido: tiene su API call, su hook, sus componentes.
- No hay estado global para datos del servidor — todo va por TanStack Query.
- El estado global solo para UI (menús, modales, temas).
- **Web y mobile comparten tipos y validadores** desde `@mbt/shared`.

### Flujo de datos típico

```
[Pantalla] → useQuery/useMutation → lib/supabase.ts → Supabase REST/Realtime
                                                          ↓
                                                       RLS Policy
                                                          ↓
                                                       Postgres
```

---

## 7. Aplicación Web (React + Vite)

### Routing

```
/                     → Landing / Home
/catalogo             → Catálogo general
/catalogo/:category   → Catálogo filtrado por categoría
/producto/:slug       → Detalle de producto
/carrito              → Carrito de compras
/checkout             → Checkout
/gracias/:orderId     → Confirmación de compra
/mi-cuenta            → Perfil del cliente
/mis-ordenes          → Historial de órdenes

/admin                → Dashboard admin
/admin/productos      → Gestión de productos
/admin/ordenes        → Gestión de órdenes
/admin/finanzas       → Panel financiero
/admin/compras        → Compras a proveedores
/admin/gastos         → Gastos operativos
/admin/clientes       → Listado de clientes
```

### Componentes de UI

Basado en **shadcn/ui** con la paleta de M&B Trend:

| Token          | Valor              |
| -------------- | ------------------ |
| `--background` | `#FFFFF7` (Marfil) |
| `--foreground` | `#1A1A1A` (Negro)  |
| `--primary`    | `#1A1A1A`          |
| `--primary-fg` | `#FFFFF7`          |
| `--accent`     | `#D4A853` (Dorado) |
| `--muted`      | `#E8E4D9` (Beige)  |

### SEO y performance

- React Router con lazy loading de rutas
- Prefetch de datos con TanStack Query
- Meta tags por página
- Sitemap generado estáticamente

---

## 8. Aplicación Mobile (React Native)

### Navegación (Expo Router)

```
/                         → Home (destacados)
/catalog                  → Catálogo
/catalog/:category        → Por categoría
/product/:slug            → Detalle
/cart                     → Carrito
/checkout                 → Checkout
/orders                   → Mis órdenes
/order/:id                → Detalle de orden
/profile                  → Perfil
/auth/login               → Login
/auth/register            → Registro
```

### Offline-first

1. TanStack Query con persistencia a MMKV
2. Las consultas GET se cachean localmente
3. Al crear una orden sin conexión → se encola y sincroniza al reconectar
4. NetInfo detecta cambios de conectividad

### Experiencia mobile

- Bottom tab navigator (Inicio, Catálogo, Carrito, Perfil)
- Pull-to-refresh en listados
- Skeletons mientras cargan imágenes
- Swipe para eliminar items del carrito

---

## 9. Módulo de administración

### Funcionalidades

| Feature           | Descripción                                               |
| ----------------- | --------------------------------------------------------- |
| Dashboard         | KPIs del día: ventas, ticket promedio, órdenes pendientes |
| Productos         | CRUD completo con carga de imágenes a Supabase Storage    |
| Variantes         | Gestión de talles, colores y stock por producto           |
| Órdenes           | Cambiar estado, ver detalle, contactar al cliente         |
| Clientes          | Historial de compras por cliente                          |
| Compras proveedor | Registrar compras de mercadería                           |
| Gastos            | Registrar gastos operativos con foto de comprobante       |
| Finanzas          | Ver caja, movimientos, gráficos de evolución              |

### Acceso

- Ruta `/admin` protegida por rol `admin`
- Marianela y Belén tienen su propio usuario admin

---

## 10. Módulo financiero

### Registros

| Concepto        | Origen                        |
| --------------- | ----------------------------- |
| Ingreso venta   | Automático al confirmar orden |
| Gasto operativo | Manual (categorizado)         |
| Compra          | Manual (mercadería)           |
| Transferencia   | Manual (retiro de caja)       |

### KPIs del dashboard

- Facturación mensual (gráfico de barras)
- Órdenes por día
- Ticket promedio
- Producto más vendido
- Rotación de stock (ítems vendidos / stock promedio)
- Margen de ganancia ((precio_venta - costo_promedio) / precio_venta)
- Clientes nuevos vs recurrentes

### Reportes descargables

- Reporte mensual (PDF o Excel)
- Extracto de caja
- Listado de productos con bajo stock

---

## 11. Integraciones

### WhatsApp Business API

- **Confirmación de orden**: cuando una orden pasa a "confirmed", se envía mensaje al cliente.
- **Notificación de envío**: cuando la orden pasa a "shipped".
- **Consulta de stock**: (opcional) para que clientes pregunten disponibilidad.
- Implementación vía **Edge Function** que llama a la API de WhatsApp Cloud (Meta).

### Instagram Shopping

- Sincronizar catálogo de productos con Instagram (formato TSV requerido por Meta).
- Etiquetar productos en publicaciones.

---

## 12. Almacenamiento de imágenes

Supabase Storage con las siguientes reglas:

```
bucket: product-images
  ├── products/{productId}/{fileName}.jpg
  ├── categories/{categorySlug}.jpg
  └── receipts/{expenseId}/{fileName}.jpg
```

Políticas de Storage:

- SELECT: público para imágenes de productos y categorías
- INSERT: solo admin
- Límite de tamaño: 5MB por imagen
- Formatos: webp (automático vía transformaciones de Supabase)

---

## 13. Plan de implementación por fases

### Fase 0 — Fundación (1-2 semanas)

- [ ] Inicializar monorepo con pnpm workspaces
- [ ] Configurar Supabase project (base de datos + auth)
- [ ] Ejecutar migraciones iniciales del esquema
- [ ] Crear `packages/shared` con tipos y validadores
- [ ] Configurar diseño de identidad visual (tema, colores, tipografía)
- [ ] Configurar CI/CD básico

### Fase 1 — Core del catálogo (2-3 semanas)

- [ ] CRUD de productos y variantes (admin web)
- [ ] Catálogo público web con filtros por categoría
- [ ] Catálogo mobile con scroll infinito
- [ ] Detalle de producto con selector de talle/color
- [ ] Búsqueda de productos

### Fase 2 — Carrito y órdenes (2-3 semanas)

- [ ] Carrito de compras (web + mobile)
- [ ] Checkout básico (seleccionar variante, calcular total)
- [ ] Órdenes con historial para el cliente
- [ ] Gestión de órdenes para admin (cambio de estado)
- [ ] Notificaciones de cambio de estado (WhatsApp)

### Fase 3 — Autenticación y clientes (1-2 semanas)

- [ ] Registro y login (web + mobile)
- [ ] Perfil de cliente
- [ ] Integración de auth con órdenes
- [ ] RLS policies definitivas

### Fase 4 — Finanzas (2-3 semanas)

- [ ] Registro de gastos
- [ ] Registro de compras a proveedores
- [ ] Dashboard financiero con KPIs
- [ ] Movimientos de caja
- [ ] Vista de rentabilidad por producto

### Fase 5 — Admin completo (2-3 semanas)

- [ ] Dashboard admin con gráficos
- [ ] Gestión de clientes
- [ ] Reportes descargables
- [ ] Alertas de stock bajo

### Fase 6 — Polaco y deployment (1-2 semanas)

- [ ] Optimización de imágenes (webp, lazy load)
- [ ] Offline mode completo en mobile
- [ ] SEO web
- [ ] Deployment:
  - Web → Vercel o Cloudflare Pages
  - Mobile → EAS Build → App Store / Google Play
- [ ] Testing E2E en flujos críticos

---

## 14. Costos estimados de infraestructura

| Servicio              | Plan                      | Costo mensual |
| --------------------- | ------------------------- | ------------- |
| Supabase              | Free tier (inicio)        | $0            |
| Supabase (producción) | Pro ($25/mes)             | $25           |
| Vercel (web)          | Free tier                 | $0            |
| EAS Build (mobile)    | Free tier (30 builds/mes) | $0            |
| WhatsApp API          | Meta (gratuito)           | $0            |
| Dominio               | .com.ar (~$4000/año)      | ~$4           |
| **Total produciendo** |                           | **~$29/mes**  |

> Nota: Supabase Free tier alcanza para desarrollo y MVP. Para producción con clientes reales, migrar a Pro (10GB DB, 100GB ancho de banda, 50GB storage).

---

_Este plan es la guía de arquitectura. Cada fase puede desglosarse en tareas concretas usando SDD cuando estés listo para arrancar._
