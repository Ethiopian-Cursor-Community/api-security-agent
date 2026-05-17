"use client";

import { ApiMap } from "@/components/api-map";
import { FindingsPanel } from "@/components/findings-panel";
import { ReportView } from "@/components/report-view";
import { ScanProgress } from "@/components/scan-progress";
import type { ScanJob } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const TERMINAL_STATUSES: ScanJob["status"][] = ["completed", "failed"];

export function ScanDashboard({ scanId }: { scanId: string }) {
  const [job, setJob] = useState<ScanJob | null>(null);
  const [tab, setTab] = useState<"overview" | "findings" | "report">("overview");
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    const res = await fetch(`/api/scan/${scanId}`);
    if (!res.ok) {
      setError("Scan not found");
      return null;
    }
    const data = (await res.json()) as ScanJob;
    setJob((prev) => {
      if (
        data.status === "completed" &&
        prev?.status !== "completed"
      ) {
        setTab("findings");
      }
      return data;
    });
    return data;
  }, [scanId]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const latestJob = await fetchJob();
      if (
        !cancelled &&
        latestJob &&
        TERMINAL_STATUSES.includes(latestJob.status)
      ) {
        clearInterval(interval);
      }
    };

    const interval = setInterval(() => {
      void poll();
    }, 800);
    void poll();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchJob]);

  if (error) {
    return (
      <p className="text-red-400">
        {error}.{" "}
        <Link href="/" className="text-emerald-400 underline">
          Start new scan
        </Link>
      </p>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500">
        Loading scan…
      </div>
    );
  }

  const running = !["completed", "failed"].includes(job.status);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            ← New scan
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-50">
            {job.apiGraph?.title ?? job.specFileName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            <a
              href={job.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400/90 hover:text-cyan-300"
            >
              {job.repoUrl}
            </a>
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Scan ID: <span className="font-mono text-zinc-500">{scanId}</span>
          </p>
        </div>
        <nav className="flex gap-2 rounded-lg border border-zinc-800 p-1">
          {(["overview", "findings", "report"] as const).map((t) => (
            <button
              key={t}
              type="button"
              disabled={t === "findings" && !job.findings}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-sm capitalize transition ${
                tab === t
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 disabled:opacity-40"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      {(running || tab === "overview") && <ScanProgress job={job} />}

      {tab === "overview" && job.apiGraph && (
        <ApiMap graph={job.apiGraph} />
      )}

      {tab === "findings" && job.findings && (
        <FindingsPanel
          scanId={scanId}
          findings={job.findings}
          onRemediated={() => void fetchJob()}
        />
      )}

      {tab === "report" && job.report && <ReportView report={job.report} />}

      {tab === "report" && !job.report && (
        <p className="text-zinc-500">Report available when scan completes.</p>
      )}
    </div>
  );
}
