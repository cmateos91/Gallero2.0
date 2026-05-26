# @gallos/web

Frontend SPA — Vite + React Router 7 + SWR.

## Stack

- **Vite 6** — Bundler / dev server
- **React 19** — UI library
- **React Router 7** — Client-side routing (library mode, `createBrowserRouter`)
- **SWR 2** — Data fetching con auto-refresh
- **CSS Modules + styled-jsx** — Sin frameworks CSS

## Estructura (definida en PROJECT_SPEC.md §5.2)

```
src/
├── main.tsx                # Entry: ReactDOM.createRoot + RouterProvider
├── router.tsx              # createBrowserRouter con todas las rutas
├── globals.css             # Estilos globales + tokens CSS
├── app/                    # Route components
│   ├── layout.tsx          # RootLayout con providers
│   ├── home.tsx            # HOME: Granja
│   ├── login.tsx
│   └── ...
├── components/             # Componentes reutilizables
│   ├── ui/                 # Botones, inputs, cards, modales
│   ├── battle/             # BattleHpCard, BattleMoveButtons
│   ├── farm/               # Componentes de la granja
│   └── layout/             # AppShell, NavigationWheel
├── context/                # React contexts (auth, pvp, toast)
├── hooks/                  # Hooks globales
├── lib/
│   ├── api/                # API client por dominio
│   ├── swr.ts              # SWR config + fetcher
│   └── settings.ts         # Persistencia de settings
└── types/                  # Declaraciones de tipos
```

## Autenticación

- **Access token** en memoria JS (variable, nunca localStorage).
- **Refresh token** en httpOnly cookie (automática, el JS no la lee).
- **API client** envía `Authorization: Bearer <accessToken>` + `credentials: "include"`.
- **On 401** → llama a `/auth/refresh` (cookie viaja sola) → retry.
- **Si refresh falla** → redirect `/login`.

## Routing

React Router en library mode con `createBrowserRouter`. Rutas protegidas con `<AuthGuard>` que redirige a `/login`.

## Data fetching

SWR con fetcher que usa `requestAuth()` del API client. Ejemplo:

```ts
const { data, error } = useSWR("/auth/me", requestAuth);
```

## Convenciones

- **Componentes:** PascalCase. CSS Module con mismo nombre (`Home.module.css`).
- **Hooks:** camelCase con prefijo `use`.
- **Placeholders:** Divs geométricos con colores. Sin assets hasta Fase 5.

## Comandos

```bash
pnpm --filter @gallos/web dev        # Vite dev server (port 5173)
pnpm --filter @gallos/web build      # Build producción
pnpm --filter @gallos/web preview    # Preview build
pnpm --filter @gallos/web test       # Vitest
pnpm --filter @gallos/web typecheck  # TypeScript check
```
