function isInternalHost(hostname: string) {
  return hostname === "0.0.0.0" || hostname === "::" || hostname === "";
}

function envPublicUrl() {
  return process.env.PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export function publicBaseUrl(request?: Request) {
  const configured = envPublicUrl();
  try {
    const url = new URL(configured);
    if (!isInternalHost(url.hostname)) {
      return url.origin;
    }
  } catch {
    // Fall back to request headers below.
  }

  const forwardedHost = request?.headers.get("x-forwarded-host");
  const host = forwardedHost || request?.headers.get("host");
  if (host) {
    const forwardedProto = request?.headers.get("x-forwarded-proto");
    const proto = forwardedProto || (process.env.NODE_ENV === "production" ? "https" : "http");
    return `${proto.split(",")[0]}://${host.split(",")[0]}`;
  }

  return configured.replace(/\/$/, "");
}

export function publicUrl(path: string, request?: Request) {
  return new URL(path, publicBaseUrl(request));
}

export function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
