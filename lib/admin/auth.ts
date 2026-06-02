import { cookies } from "next/headers";

const COOKIE_NAME = "sweepstake_admin";

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === secret;
}

export async function setAdminCookie(secret: string): Promise<boolean> {
  if (secret !== process.env.ADMIN_SECRET) return false;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  return true;
}
