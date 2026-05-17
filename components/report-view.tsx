"use client";

import type { SecurityReport } from "@/lib/types";

export function ReportView({ report }: { report: SecurityReport }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 print:border-0 print:bg-white">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50">Security report</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 print:hidden"
        >
          Print / PDF
        </button>
      </div>

      <section className="mb-8">
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Executive summary
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          {report.executiveSummary.replace(/\*\*/g, "")}
        </p>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Total endpoints"
          value={report.attackSurface.totalEndpoints}
        />
        <Metric
          label="Public"
          value={report.attackSurface.publicEndpoints}
        />
        <Metric
          label="Authenticated"
          value={report.attackSurface.authenticatedEndpoints}
        />
        <Metric
          label="High risk"
          value={report.attackSurface.highRiskEndpoints}
        />
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Findings by severity
        </h3>
        <div className="flex flex-wrap gap-3">
          {(
            Object.entries(report.findingsBySeverity) as [string, number][]
          ).map(([sev, count]) => (
            <div
              key={sev}
              className="rounded-lg border border-zinc-800 px-4 py-2 text-center"
            >
              <p className="text-2xl font-semibold text-zinc-100">{count}</p>
              <p className="text-xs uppercase text-zinc-500">{sev}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Top risks
        </h3>
        <ul className="space-y-2 text-sm text-zinc-300">
          {report.topRisks.map((risk) => (
            <li
              key={risk}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2"
            >
              {risk}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Compliance checklist
        </h3>
        <ul className="space-y-2">
          {report.complianceChecklist.map((item) => (
            <li
              key={item.item}
              className="flex items-center gap-3 text-sm text-zinc-300"
            >
              <StatusDot status={item.status} />
              {item.item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Remediation
        </h3>
        <p className="mt-2 text-sm text-zinc-300">{report.remediationSummary}</p>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function StatusDot({
  status,
}: {
  status: "pass" | "fail" | "warn";
}) {
  const color =
    status === "pass"
      ? "bg-emerald-500"
      : status === "fail"
        ? "bg-red-500"
        : "bg-amber-500";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />;
}
