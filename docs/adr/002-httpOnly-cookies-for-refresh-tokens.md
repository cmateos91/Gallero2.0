# ADR-002: httpOnly cookies para refresh tokens

**Fecha:** 2026-05-26
**Estado:** Accepted

## Contexto

El spec original (v1) almacenaba tanto el access token como el refresh token en `localStorage` del navegador. Esto es vulnerable a XSS: cualquier script malicioso puede leer `localStorage` y robar ambos tokens.

En una SPA de juego con economía interna (monedas), un token robado permite vaciar la cuenta del usuario.

## Decisión

- **Access token:** Se devuelve en el body de la respuesta de login/refresh. El frontend lo guarda en una variable JavaScript (memoria). No se persiste en localStorage ni sessionStorage. Se pierde al cerrar la pestaña.
- **Refresh token:** Se establece como cookie `httpOnly`, `Secure`, `SameSite=Lax`. El JavaScript del frontend nunca puede leer esta cookie.
- **Rotación:** Cada vez que se usa el refresh token, se revoca la sesión anterior (Redis blacklist) y se crea una nueva.

## Alternativas consideradas

1. **Ambos tokens en localStorage (v1):** Simple pero vulnerable a XSS.
2. **Ambos tokens en httpOnly cookies:** Más seguro pero requiere CSRF protection adicional para mutations.
3. **Backend-for-Frontend (BFF) pattern:** Un proxy que maneja tokens server-side. Overkill para este proyecto.

## Consecuencias

- **Positivo:** El refresh token no es accesible desde JavaScript. Robo de access token limitado a 15 min. Rotación impide reuso.
- **Negativo:** El access token se pierde al refrescar la página (hay que re-autenticar vía refresh). Lógica de refresh más compleja en el API client.
- **Mitigación:** El API client implementa auto-refresh transparente. El SWR re-fetch al recuperar foco también refresca el token.
