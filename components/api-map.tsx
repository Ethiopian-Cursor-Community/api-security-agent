import type { ApiGraph } from "@/lib/types";

export function ApiMap({ graph }: { graph: ApiGraph }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
        API attack surface
      </h2>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Endpoints" value={graph.totalEndpoints} />
        <Stat label="Public" value={graph.publicCount} warn />
        <Stat label="Authenticated" value={graph.authenticatedCount} />
        <Stat label="High risk" value={graph.highRiskCount} warn />
      </div>

      <div className="max-h-80 overflow-auto rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-zinc-900 text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Method</th>
              <th className="px-3 py-2 font-medium">Path</th>
              <th className="px-3 py-2 font-medium">Auth</th>
              <th className="px-3 py-2 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {graph.endpoints.map((ep) => (
              <tr
                key={ep.id}
                className="border-t border-zinc-800/80 hover:bg-zinc-800/40"
              >
                <td className="px-3 py-2 font-mono text-xs uppercase text-cyan-400">
                  {ep.method}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-zinc-300">
                  {ep.path}
                </td>
                <td className="px-3 py-2 text-xs">
                  {ep.requiresAuth ? (
                    <span className="text-emerald-400">yes</span>
                  ) : (
                    <span className="text-red-400">no</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <RiskBar score={ep.riskScore} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${warn && value > 0 ? "text-amber-400" : "text-zinc-100"}`}
      >
        {value}
      </p>
    </div>
  );
}

function RiskBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-red-500" : score >= 45 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="font-mono text-xs text-zinc-500">{score}</span>
    </div>
  );
}
