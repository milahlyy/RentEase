import type { User } from "@rentease/shared";
import { apiRequest } from "./api";

export type AuthMeResponse = {
  user: User;
};

const cookieSessionSentinel = "cookie-session";

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return cookieSessionSentinel;
}

export function setStoredToken(_token?: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("rentease_token");
  window.dispatchEvent(new Event("rentease-auth-changed"));
}

export function clearStoredToken() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("rentease_token");
  window.dispatchEvent(new Event("rentease-auth-changed"));
}

export async function logoutSession() {
  return apiRequest<{ loggedOut: boolean }>("/auth/logout", {
    method: "POST",
  });
}

export async function fetchCurrentUser(_token?: string) {
  return apiRequest<AuthMeResponse>("/auth/me");
}
