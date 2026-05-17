import type { ScanJob } from "@/lib/types";

const PHASES = [
  "parsing",
  "mapping",
  "planning",
  "scanning",
  "analyzing",
  "completed",
] as const;

export function ScanProgress({ job }: { job: ScanJob }) {
  const phaseIndex = PHASES.indexOf(
    job.status as (typeof PHASES)[number]
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Scan progress
        </h2>
        <span className="font-mono text-sm text-emerald-400">{job.progress}%</span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-cyan-500 transition-all duration-500"
          style={{ width: `${job.progress}%` }}
        />
      </div>

      <p className="text-sm text-zinc-300">{job.message}</p>

      {job.status === "failed" && job.error && (
        <p className="mt-2 text-sm text-red-400">{job.error}</p>
      )}

      <ul className="mt-6 grid gap-2 sm:grid-cols-3">
        {PHASES.slice(0, -1).map((phase, i) => {
          const done = phaseIndex > i || job.status === "completed";
          const active = job.status === phase;
          return (
            <li
              key={phase}
              className={`rounded-lg border px-3 py-2 text-xs capitalize ${
                done
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : active
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                    : "border-zinc-800 text-zinc-600"
              }`}
            >
              {phase.replace("_", " ")}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
