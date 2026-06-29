import type { User } from "@rentease/shared";
import { apiRequest } from "./api";

export type AuthMeResponse = {
  user: User;
};

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("rentease_token");
}

export function setStoredToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("rentease_token", token);
  window.dispatchEvent(new Event("rentease-auth-changed"));
}

export function clearStoredToken() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("rentease_token");
  window.dispatchEvent(new Event("rentease-auth-changed"));
}

export async function fetchCurrentUser(token: string) {
  return apiRequest<AuthMeResponse>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
