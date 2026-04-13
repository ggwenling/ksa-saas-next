import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

export const SESSION_COOKIE_NAME = "kas_session";
const SESSION_TTL_DAYS = 7;

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

  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export async function getSessionTokenFromCookie() {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}
