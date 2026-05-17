import type { Severity } from "@/lib/types";

const STYLES: Record<Severity, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  low: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  info: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${STYLES[severity]}`}
    >
      {severity}
    </span>
  );
}
