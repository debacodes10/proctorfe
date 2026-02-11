"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "../lib/auth";
import { getApiBaseUrl } from "../lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);

      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: form.toString()
      });

      if (res.status === 401) {
        const errText = await res.text().catch(() => "");
        console.error("[AUTH] 401 Unauthorized on POST /auth/login.", errText);
        throw new Error("Invalid credentials");
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "Login request failed");
      }

      const data = await res.json();
      if (!data?.access_token) {
        throw new Error("Login response missing access_token");
      }

      setToken(data.access_token);

      // decode JWT payload (simple)
      JSON.parse(atob(data.access_token.split(".")[1]));

      // Temporary routing logic (we improve later)
      if (email.includes("admin")) {
        router.push("/admin/dashboard");
      } else {
        router.push("/student/exam");
      }

    } catch (err) {
      console.error("[AUTH] Login flow failed:", err);
      setError("Login failed. Check credentials.");
    }
  }

  return (
    <main className="app-shell flex items-center">
      <div className="app-container grid gap-6 lg:grid-cols-[1.1fr_420px]">
        <section className="surface-card hidden p-10 lg:block">
          <p className="status-pill w-fit">
            <span className="status-dot active" />
            Candidate Portal
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900">
            Exam Access
            <span className="block text-blue-700">With Real-Time Monitoring</span>
          </h1>
          <p className="mt-5 max-w-xl text-base label-soft">
            Sign in to start your proctored session. Keep your camera enabled and
            stay on the exam tab once your test begins.
          </p>
          <div className="mt-8 grid gap-3 text-sm">
            <div className="surface-card rounded-xl p-4">
              <p className="font-semibold text-slate-900">Before You Start</p>
              <p className="mt-1 label-soft">
                Ensure stable internet, visible face framing, and proper lighting.
              </p>
            </div>
            <div className="surface-card rounded-xl p-4">
              <p className="font-semibold text-slate-900">During Exam</p>
              <p className="mt-1 label-soft">
                Switching tabs or losing focus may be captured as a proctoring event.
              </p>
            </div>
          </div>
        </section>

        <section className="surface-card p-8">
          <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
          <p className="mt-1 text-sm label-soft">
            Use your registered credentials to continue.
          </p>

          <form onSubmit={handleLogin} className="mt-7 space-y-4">
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </span>
              <input
                type="email"
                placeholder="name@example.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </span>
              <input
                type="password"
                placeholder="Enter your password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button type="submit" className="btn-primary mt-2 w-full py-2.5 text-sm">
              Login
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
