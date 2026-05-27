import { requestAuth, setAccessToken, clearAccessToken } from "./client.js";
import type { AuthUserDto } from "../../types/api.js";

const API = "/api";

interface AuthResponse {
  accessToken: string;
  user: AuthUserDto;
}

export function loginApi(emailOrUsername: string, password: string): Promise<AuthResponse> {
  return requestAuth<AuthResponse>(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrUsername, password }),
  });
}

export function registerApi(
  email: string,
  username: string,
  password: string,
): Promise<AuthResponse> {
  return requestAuth<AuthResponse>(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
}

export function loginGoogleApi(idToken: string): Promise<AuthResponse> {
  return requestAuth<AuthResponse>(`${API}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

export function logoutApi(): Promise<void> {
  return requestAuth(`${API}/auth/logout`, { method: "POST" }).then(() => {
    clearAccessToken();
  });
}

export function fetchMe(): Promise<AuthUserDto> {
  return requestAuth<AuthUserDto>(`${API}/auth/me`);
}

export function fetchFeathers() {
  return requestAuth<{ feathers: unknown[] }>(`${API}/auth/feathers`);
}

export function rollFeather(screen?: string) {
  return requestAuth<{ spawned: boolean; xPct?: number; yPct?: number; id?: string }>(
    `${API}/auth/feathers/roll`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ screen }),
    },
  );
}

export function collectFeather(featherId: string) {
  return requestAuth<{ coins: number }>(`${API}/auth/collect-feather`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ featherId }),
  });
}

export { setAccessToken, clearAccessToken };
