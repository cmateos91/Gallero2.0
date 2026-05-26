/**
 * Authenticated API client with auto-refresh.
 *
 * Usage:
 *   import { requestAuth } from "@/lib/api/client";
 *   const data = await requestAuth<User>("/auth/me");
 *
 * Flow:
 *   1. Adds Authorization: Bearer <accessToken from memory>
 *   2. On 401: calls /auth/refresh (httpOnly cookie sent automatically)
 *   3. On refresh success: retries original request
 *   4. On refresh failure: clears auth state, redirects to /login
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error ${String(status)}`);
  }
}

export async function requestAuth<T>(url: string, options?: RequestInit): Promise<T> {
  // TODO: Fase 4 — Implementar con acceso al AuthContext
  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => null));
  }

  return res.json() as Promise<T>;
}
