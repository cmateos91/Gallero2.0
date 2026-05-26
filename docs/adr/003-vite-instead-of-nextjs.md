# ADR-003: Vite + React Router en lugar de Next.js

**Fecha:** 2026-05-26
**Estado:** Accepted

## Contexto

El spec original (v1) especificaba Next.js 15 con App Router, pero forzaba `"use client"` en todos los componentes. Esto convertía Next.js en una SPA pura, desactivando SSR, RSC, Server Actions y cualquier beneficio del framework.

Next.js App Router está diseñado para aplicaciones con SSR/RSC. Usarlo como SPA pura es luchar contra el framework:
- Hidratación innecesaria (el servidor renderiza HTML que el cliente descarta y re-renderiza).
- Bundle más grande por incluir el runtime de Next.js.
- Configuración más compleja que alternativas nativas para SPA.
- Sin beneficio real vs una SPA pura.

## Decisión

**Vite + React Router 7** como stack frontend.

- **Vite** como bundler/dev server. HMR instantáneo (sin hidratación).
- **React Router 7** en library mode (`createBrowserRouter`) para routing client-side.
- Sin SSR, sin RSC, sin Server Actions. SPA pura desde el día 1.

## Alternativas consideradas

1. **Next.js 15 como SPA (spec v1):** Funciona pero es un antipatrón. Descarte.
2. **Next.js con Pages Router:** Más ligero que App Router para SPA, pero aún así overkill. Descarte.
3. **TanStack Start:** Framework nuevo, menos maduro que Vite + React Router. Descarte.
4. **Remix SPA mode:** Buena opción pero más opinado que React Router puro. Descarte.

## Consecuencias

- **Positivo:** Dev server más rápido. Bundle más chico. Sin hidratación. Tooling más simple. React Router es el estándar para SPAs.
- **Negativo:** Se pierde el ecosistema Next.js (Vercel deploy, image optimization, middleware). No hay file-based routing ni layouts anidados automáticos.
- **Mitigación:** Vite tiene plugin de deploy a Vercel si se necesita. React Router soporta layouts anidados con `<Outlet />`. El proxy de Vite reemplaza los API routes de Next.js.
