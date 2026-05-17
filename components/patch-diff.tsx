import type { PatchResult } from "@/lib/types";

export function PatchDiff({ patch }: { patch: PatchResult }) {
  return (
    <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Patch diff
        </h4>
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            patch.mode === "cursor_sdk"
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {patch.mode === "cursor_sdk" ? "Cursor SDK" : "Simulated"}
        </span>
      </div>
      <p className="border-b border-zinc-800 px-4 py-3 text-sm text-zinc-400">
        {patch.summary}
      </p>
      {patch.filesTouched.length > 0 && (
        <p className="px-4 py-2 text-xs text-zinc-500">
          Files: {patch.filesTouched.join(", ")}
        </p>
      )}
      <pre className="max-h-64 overflow-auto p-4 font-mono text-xs leading-relaxed text-zinc-300">
        {patch.diff}
      </pre>
    </div>
  );
}

