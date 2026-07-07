# M&B Trend

Monorepo para la tienda online **M&B Trend** — indumentaria y accesorios.

## Stack

| Capa           | Tecnología                                         |
| -------------- | -------------------------------------------------- |
| **Monorepo**   | pnpm workspaces                                    |
| **Lenguaje**   | TypeScript 5.x                                     |
| **Web**        | React 18+ / Vite 5+ / Tailwind CSS v4              |
| **Mobile**     | React Native / Expo SDK 52+ / NativeWind v5        |
| **Backend**    | Supabase (Postgres, Auth, Storage, Edge Functions) |
| **Cache**      | TanStack Query                                     |
| **Validación** | Zod                                                |

## Inicio rápido

```bash
# Instalar pnpm (si no lo tenés)
npm install -g pnpm@9

# Instalar dependencias
pnpm install

# Verificar TypeScript en todos los paquetes
pnpm type-check
```

## Estructura

```
m&b/
├── packages/
│   ├── shared/    # Tipos, validadores, constantes y utilidades compartidas
│   ├── web/       # Aplicación web (React + Vite)
│   └── mobile/    # Aplicación mobile (React Native + Expo)
├── supabase/      # Migraciones, config y Edge Functions
└── PLAN_ARQUITECTURA.md
```

## Scripts

| Comando           | Descripción                |
| ----------------- | -------------------------- |
| `pnpm lint`       | Ejecutar ESLint            |
| `pnpm format`     | Formatear con Prettier     |
| `pnpm type-check` | Verificar tipos TypeScript |
| `pnpm clean`      | Limpiar directorios dist   |
