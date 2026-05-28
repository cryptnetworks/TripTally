export const OAUTH_LOGIN_COOKIE = "__Host-triptally.oauth-login-token";

export function readCookieValue(cookieHeader: string | null | undefined, name: string) {
  return cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
