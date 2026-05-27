import { requestAuth } from "./client.js";
import type { FriendDto, FriendRequestDto } from "../../types/api.js";

const API = "/api";

export function fetchFriends() {
  return requestAuth<{ friends: FriendDto[] }>(`${API}/friends`);
}

export function searchPlayers(query: string) {
  return requestAuth<{ players: FriendDto[] }>(`${API}/friends/search?q=${encodeURIComponent(query)}`);
}

export function fetchFriendRequests() {
  return requestAuth<{ requests: FriendRequestDto[] }>(`${API}/friends/requests`);
}

export function sendFriendRequest(receiverId: string) {
  return requestAuth<{ ok: true }>(`${API}/friends`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receiverId }),
  });
}

export function acceptFriendRequest(requestId: string) {
  return requestAuth<{ ok: true }>(`${API}/friends/requests/${requestId}/accept`, {
    method: "POST",
  });
}

export function rejectFriendRequest(requestId: string) {
  return requestAuth<{ ok: true }>(`${API}/friends/requests/${requestId}/reject`, {
    method: "POST",
  });
}

export function removeFriend(friendId: string) {
  return requestAuth<Record<string, never>>(`${API}/friends/${friendId}`, { method: "DELETE" });
}
