"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../../lib/auth";

type SessionEvent = {
  id?: number | string;
  event_type?: string;
  severity?: number;
  [key: string]: unknown;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as T[];
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.events)) return record.events as T[];
  }
  return [];
}

function toDisplay(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export default function SessionEventsPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [token] = useState<string | null>(() => getToken());
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState("");

  const fetchEvents = useCallback(async () => {
    if (!token || !sessionId) return;

    setLoadingEvents(true);
    setEventsError("");
    try {
      const res = await fetch(`${API_BASE}/admin/sessions/${sessionId}/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to load events (${res.status})`);
      }
      const json = await res.json();
      setEvents(asArray<SessionEvent>(json));
    } catch (err) {
      setEvents([]);
      setEventsError(err instanceof Error ? err.message : "Failed to load session events");
    } finally {
      setLoadingEvents(false);
    }
  }, [token, sessionId]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return (
    <main className="app-shell">
      <div className="app-container space-y-5">
        <header className="surface-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Session Event Logs</h1>
              <p className="mt-1 text-sm label-soft">Session ID: {sessionId}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/dashboard"
                className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={() => void fetchEvents()}
                className="btn-primary px-4 py-2 text-sm"
                disabled={loadingEvents || !token}
              >
                {loadingEvents ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs label-soft">API Base: {API_BASE}</p>
        </header>

        <section className="surface-card p-5">
          {eventsError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {eventsError}
            </p>
          )}

          <div className="mt-3 space-y-2">
            {loadingEvents && <p className="text-sm label-soft">Loading events...</p>}
            {!loadingEvents && events.length === 0 && (
              <p className="text-sm label-soft">No events found for this session.</p>
            )}
            {events.map((event, idx) => (
              <div
                key={`${event.id ?? "event"}-${idx}`}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {toDisplay(event.event_type ?? "EVENT")}
                  </p>
                  <p className="text-xs label-soft">Severity: {toDisplay(event.severity)}</p>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-blue-700">
                    View Raw Payload
                  </summary>
                  <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-slate-900 p-2 text-xs text-slate-100">
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
