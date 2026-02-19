/**
 * Sign in with credentials by POSTing directly to NextAuth callback.
 * Use this when signIn("credentials", ...) redirects to the sign-in page
 * because the credentials provider is not in the public providers list.
 */
export async function signInWithCredentials(
  email: string,
  password: string,
  callbackUrl: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const base = typeof window !== "undefined" ? "" : process.env.NEXTAUTH_URL ?? "";
  const basePath = "/api/auth";

  const csrfRes = await fetch(`${base}${basePath}/csrf`, { credentials: "include" });
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData?.csrfToken ?? csrfData?.token;
  if (!csrfToken) {
    return { ok: false, error: "Could not get CSRF token" };
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullCallbackUrl = callbackUrl.startsWith("http") ? callbackUrl : `${origin}${callbackUrl.startsWith("/") ? callbackUrl : "/" + callbackUrl}`;
  const body = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: fullCallbackUrl,
  });

  const res = await fetch(`${base}${basePath}/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: body.toString(),
    credentials: "include",
    redirect: "manual",
  });

  const location = res.headers.get("location");
  if (res.status === 302 && location && !location.includes("error=")) {
    return { ok: true, url: location };
  }
  const contentType = res.headers.get("content-type");
  const data = contentType?.includes("application/json") ? await res.json().catch(() => ({})) : {};
  const url = data?.url ?? location ?? null;
  if (res.ok && url && typeof url === "string" && !url.includes("error=")) {
    return { ok: true, url };
  }
  const error = url && typeof url === "string" ? (() => { try { return new URL(url, "http://x").searchParams.get("error"); } catch { return undefined; } })() : undefined;
  return { ok: false, url: typeof url === "string" ? url : undefined, error: error ?? "Sign in failed" };
}
