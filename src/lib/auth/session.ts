import { cookies, headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

export const SESSION_COOKIE_NAME = "kas_session";
const SESSION_TTL_DAYS = 7;

function isLocalHost(host: string | null) {
  if (!host) {
    return false;
  }

  const normalizedHost = host.trim().toLowerCase();

  return (
    normalizedHost.startsWith("localhost:") ||
    normalizedHost === "localhost" ||
    normalizedHost.startsWith("127.0.0.1:") ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost.startsWith("[::1]:") ||
    normalizedHost === "[::1]"
  );
}

async function shouldUseSecureSessionCookie() {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");

  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim().toLowerCase() === "https";
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  return !isLocalHost(host);
}

async function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: await shouldUseSecureSessionCookie(),
    path: "/",
  };
}

export async function createSession(userId: string) {
  const token = randomUUID().replaceAll("-", "");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  const options = await getSessionCookieOptions();

  store.set(SESSION_COOKIE_NAME, token, {
    ...options,
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  const options = await getSessionCookieOptions();
  store.set(SESSION_COOKIE_NAME, "", {
    ...options,
    maxAge: 0,
  });
}

export async function getSessionTokenFromCookie() {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}
