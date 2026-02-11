"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "../../lib/auth";

type SessionInfo = {
  id?: number | string;
  session_id?: number | string;
  [key: string]: unknown;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as T[];
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.sessions)) return record.sessions as T[];
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

function getSessionId(session: SessionInfo): number | string | null {
  return session.id ?? session.session_id ?? null;
}

export default function AdminDashboardPage() {
  const [token] = useState<string | null>(() => getToken());
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const sessionColumns = useMemo(() => {
    const defaultColumns = ["id", "user_id", "exam_id", "status", "started_at", "ended_at"];
    if (sessions.length === 0) return defaultColumns;
    const keys = Object.keys(sessions[0]);
    return defaultColumns.filter((key) => keys.includes(key)).concat(
      keys.filter((key) => !defaultColumns.includes(key)).slice(0, 3)
    );
  }, [sessions]);

  const fetchSessions = useCallback(async (authToken: string) => {
    setLoadingSessions(true);
    setSessionError("");
    try {
      const res = await fetch(`${API_BASE}/admin/sessions`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load sessions (${res.status})`);
      }

      const json = await res.json();
      const allSessions = asArray<SessionInfo>(json);
      setSessions(allSessions);
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void fetchSessions(token);
  }, [token, fetchSessions]);

  return (
    <main className="app-shell">
      <div className="app-container space-y-5">
        <header className="surface-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm label-soft">
                Monitor all sessions and open a dedicated page for event logs.
              </p>
            </div>
            <button
              onClick={() => token && void fetchSessions(token)}
              className="btn-primary px-4 py-2 text-sm"
              disabled={!token || loadingSessions}
            >
              {loadingSessions ? "Refreshing..." : "Refresh Sessions"}
            </button>
          </div>
          <p className="mt-3 text-xs label-soft">API Base: {API_BASE}</p>
        </header>

        <section className="surface-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">All Sessions</h2>
          {sessionError && (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {sessionError}
            </p>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-slate-600">
                  {sessionColumns.map((column) => (
                    <th key={column} className="px-3 py-2 font-semibold">
                      {column}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, index) => {
                  const id = getSessionId(session);
                  return (
                    <tr key={`${id ?? "session"}-${index}`} className="border-b border-[var(--border)]">
                      {sessionColumns.map((column) => (
                        <td key={column} className="px-3 py-2 text-slate-800">
                          {toDisplay(session[column])}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        {id !== null ? (
                          <Link
                            href={`/admin/sessions/${id}/events`}
                            className="inline-block rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            View Events
                          </Link>
                        ) : (
                          <span className="text-xs label-soft">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!loadingSessions && sessions.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-sm label-soft" colSpan={sessionColumns.length + 1}>
                      No sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
