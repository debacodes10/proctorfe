import { getApiBaseUrl } from "./config";
import { getToken } from "./auth";

const API_URL = getApiBaseUrl();

type RequestHeaders = Record<string, string>;

function mergeHeaders(
  base: RequestHeaders,
  extra?: HeadersInit
): Headers {
  const headers = new Headers(base);
  if (extra instanceof Headers) {
    extra.forEach((value, key) => headers.set(key, value));
    return headers;
  }
  if (Array.isArray(extra)) {
    extra.forEach(([key, value]) => headers.set(key, value));
    return headers;
  }
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => headers.set(key, value));
  }
  return headers;
}

async function logAuthFailure(res: Response, method: string, path: string) {
  if (res.status !== 401) return;
  const responseBody = await res
    .clone()
    .text()
    .catch(() => "");
  console.error(
    `[AUTH] 401 Unauthorized on ${method.toUpperCase()} ${path}. Token may be missing, invalid, or expired.`,
    responseBody
  );
}

export async function apiRequest(
  path: string,
  method: string = "GET",
  body?: unknown,
  token?: string
) {
  const authToken = token ?? getToken();

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  await logAuthFailure(res, method, path);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "API request failed");
  }

  return res.json();
}

export async function authFetch(
  path: string,
  init: RequestInit = {},
  token?: string
) {
  const authToken = token ?? getToken();
  const method = init.method ?? "GET";
  const headers = mergeHeaders({}, init.headers);

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    method,
    headers,
  });

  await logAuthFailure(res, method, path);
  return res;
}
