import { getApiBaseUrl } from "./config";

const API_URL = getApiBaseUrl();

export async function apiRequest(
  path: string,
  method: string = "GET",
  body?: unknown,
  token?: string
) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "API request failed");
  }

  return res.json();
}
