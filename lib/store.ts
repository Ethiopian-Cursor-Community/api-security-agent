import type { ScanJob } from "@/lib/types";

const globalStore = globalThis as typeof globalThis & {
  __securityAgentScans?: Map<string, ScanJob>;
};

function getStore(): Map<string, ScanJob> {
  if (!globalStore.__securityAgentScans) {
    globalStore.__securityAgentScans = new Map();
  }
  return globalStore.__securityAgentScans;
}

export function saveScan(job: ScanJob): void {
  getStore().set(job.id, job);
}

export function getScan(id: string): ScanJob | undefined {
  return getStore().get(id);
}

export function updateScan(
  id: string,
  patch: Partial<ScanJob>
): ScanJob | undefined {
  const existing = getStore().get(id);
  if (!existing) return undefined;
  const updated: ScanJob = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  getStore().set(id, updated);
  return updated;
}

export function listScans(): ScanJob[] {
  return [...getStore().values()].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
