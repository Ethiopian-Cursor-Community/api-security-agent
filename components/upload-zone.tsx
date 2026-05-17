"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function UploadZone() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState("");

  const startScan = useCallback(async () => {
    const targetRepoUrl = repoUrl.trim();
    if (!targetRepoUrl) {
      setError("Enter a GitHub repository link.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: targetRepoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start scan");
      router.push(`/scan/${data.scanId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start scan");
      setLoading(false);
    }
  }, [repoUrl, router]);

  return (
    <div className="w-full max-w-xl">
      <label className="block">
        <span className="text-sm font-medium text-zinc-300">
          GitHub repository
        </span>
        <input
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          disabled={loading}
          placeholder="https://github.com/owner/backend-api"
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition focus:border-emerald-500 disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter") void startScan();
          }}
        />
        <span className="mt-1 block text-xs text-zinc-500">
          Public repos clone automatically. Set GITHUB_TOKEN for private repos.
        </span>
      </label>

      <button
        type="button"
        onClick={() => void startScan()}
        disabled={loading || !repoUrl.trim()}
        className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Cloning & scanning…" : "Start security scan"}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
