"use client";

import { SeverityBadge } from "@/components/severity-badge";
import { PatchDiff } from "@/components/patch-diff";
import type { Finding } from "@/lib/types";
import { useState } from "react";

export function FindingsPanel({
  scanId,
  findings,
  onRemediated,
}: {
  scanId: string;
  findings: Finding[];
  onRemediated: () => void;
}) {
  const [selectedId, setSelectedId] = useState(findings[0]?.id ?? null);
  const [remediating, setRemediating] = useState(false);

  const selected = findings.find((f) => f.id === selectedId) ?? findings[0];

  async function remediate(findingId: string) {
    setRemediating(true);
    try {
      const res = await fetch("/api/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, findingId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Remediation failed");
      }
      onRemediated();
    } finally {
      setRemediating(false);
    }
  }

  if (findings.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-500">
        No vulnerabilities detected in simulated scan.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <h2 className="border-b border-zinc-800 px-4 py-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Findings ({findings.length})
        </h2>
        <ul className="max-h-[32rem] overflow-auto">
          {findings.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setSelectedId(f.id)}
                className={`w-full border-b border-zinc-800/60 px-4 py-3 text-left transition hover:bg-zinc-800/50 ${
                  selected?.id === f.id ? "bg-zinc-800/80" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-100">{f.title}</p>
                  <SeverityBadge severity={f.severity} />
                </div>
                <p className="mt-1 font-mono text-xs text-zinc-500">
                  {f.endpoint.method.toUpperCase()} {f.endpoint.path}
                </p>
                {f.remediationStatus === "completed" && (
                  <span className="mt-1 inline-block text-xs text-emerald-400">
                    patched
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selected && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={selected.severity} />
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              {selected.category.replace(/_/g, " ")}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-zinc-50">{selected.title}</h3>
          <p className="mt-1 font-mono text-sm text-cyan-400/90">
            {selected.endpoint.method.toUpperCase()} {selected.endpoint.path}
          </p>

          <Section title="Explanation">{selected.explanation}</Section>
          <Section title="Business impact">{selected.businessImpact}</Section>
          <Section title="Recommendation">{selected.recommendation}</Section>

          {selected.examplePayload && (
            <Section title="Example payload">
              <code className="block rounded-lg bg-zinc-950 p-3 font-mono text-xs text-amber-200/90">
                {selected.examplePayload}
              </code>
            </Section>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={remediating || selected.remediationStatus === "completed"}
              onClick={() => void remediate(selected.id)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {remediating
                ? "Running Cursor SDK…"
                : selected.remediationStatus === "completed"
                  ? "Remediation applied"
                  : "Auto-patch with Cursor SDK"}
            </button>
          </div>

          {selected.patch && <PatchDiff patch={selected.patch} />}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </h4>
      <p className="mt-1 text-sm leading-relaxed text-zinc-300">{children}</p>
    </div>
  );
}
