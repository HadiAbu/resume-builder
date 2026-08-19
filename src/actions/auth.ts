"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BACKEND_URL } from "@/lib/backend";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, matches the JWT expiry

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0 && typeof detail[0]?.msg === "string") {
    return detail[0].msg;
  }
  return null;
}

async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function signupAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");

  const response = await fetch(`${BACKEND_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = extractErrorMessage(body) ?? "Signup failed. Please try again.";
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  const data = (await response.json()) as { token: string };
  await setSessionCookie(data.token);

  redirect("/");
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const response = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = extractErrorMessage(body) ?? "Login failed. Please try again.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  const data = (await response.json()) as { token: string };
  await setSessionCookie(data.token);

  redirect("/");
}
