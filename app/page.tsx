import Link from "next/link";

export default function Home() {
  return (
    <main className="app-shell">
      <div className="app-container">
        <section className="surface-card overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 lg:p-12">
              <p className="status-pill w-fit">
                <span className="status-dot active" />
                Live Proctoring Ready
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900">
                Secure Online Proctoring
                <span className="block text-blue-700">For High-Stakes Exams</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed label-soft">
                Monitor candidate behavior with camera verification, frame analysis,
                and tab-switch detection in a single exam session workflow.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login" className="btn-primary px-5 py-3 text-sm">
                  Continue To Login
                </Link>
              </div>
            </div>

            <div className="bg-[linear-gradient(160deg,#e8f0ff,#f5f8ff)] p-8 lg:p-12">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                Core Capabilities
              </h2>
              <ul className="mt-5 space-y-4">
                <li className="surface-card rounded-xl p-4">
                  <p className="font-semibold text-slate-900">Continuous Camera Feed</p>
                  <p className="mt-1 text-sm label-soft">
                    Candidate stream initializes before exam start and remains active.
                  </p>
                </li>
                <li className="surface-card rounded-xl p-4">
                  <p className="font-semibold text-slate-900">Automated Frame Analysis</p>
                  <p className="mt-1 text-sm label-soft">
                    Frames are submitted in intervals for backend CV verification.
                  </p>
                </li>
                <li className="surface-card rounded-xl p-4">
                  <p className="font-semibold text-slate-900">Behavior Event Tracking</p>
                  <p className="mt-1 text-sm label-soft">
                    Visibility and focus changes can be detected and logged.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
