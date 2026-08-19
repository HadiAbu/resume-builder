"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BACKEND_URL } from "@/lib/backend";
import { requireSessionToken } from "@/lib/session";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB

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

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({ name: SESSION_COOKIE, path: "/" });

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

export async function updateProfileAction(formData: FormData): Promise<void> {
  const token = await requireSessionToken();

  const displayName = String(formData.get("displayName") ?? "");
  const bio = String(formData.get("bio") ?? "") || null;
  const role = String(formData.get("role") ?? "") || null;
  const githubUrl = String(formData.get("githubUrl") ?? "") || null;
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "") || null;
  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  let photoUrl: string | null = null;
  const photo = formData.get("photo");

  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) {
      redirect(`/dashboard?error=${encodeURIComponent("Photo must be an image file.")}`);
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      redirect(`/dashboard?error=${encodeURIComponent("Photo must be under 2MB.")}`);
    }

    const buffer = await photo.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    photoUrl = `data:${photo.type};base64,${base64}`;
  }

  const response = await fetch(`${BACKEND_URL}/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ displayName, bio, role, githubUrl, linkedinUrl, skills, photoUrl }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      redirect("/login");
    }
    const body: unknown = await response.json().catch(() => null);
    const message = extractErrorMessage(body) ?? "Update failed. Please try again.";
    redirect(`/dashboard?error=${encodeURIComponent(message)}`);
  }

  redirect("/dashboard?updated=1");
}
