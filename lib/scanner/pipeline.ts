import { discoverOpenApiSpec } from "@/lib/openapi/discover";
import { mapApiGraph } from "@/lib/openapi/mapper";
import { parseSpecContent } from "@/lib/openapi/parser";
import { cloneGitHubRepo, getCloneDirectory } from "@/lib/github/clone";
import { parseGitHubRepoUrl } from "@/lib/github/parse";
import { generateReport } from "@/lib/reports/generator";
import { analyzeFindings } from "@/lib/scanner/analyzer";
import { buildScanPlan } from "@/lib/scanner/planner";
import { runSimulatedScan } from "@/lib/scanner/simulator";
import { getScan, saveScan, updateScan } from "@/lib/store";
import type { ScanJob, ScanStatus } from "@/lib/types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setPhase(
  id: string,
  status: ScanStatus,
  progress: number,
  message: string
): Promise<void> {
  updateScan(id, { status, progress, message });
  await delay(400);
}

export async function runScanPipeline(
  scanId: string,
  repoUrl: string
): Promise<void> {
  try {
    const parsed = parseGitHubRepoUrl(repoUrl);

    await setPhase(scanId, "parsing", 8, `Cloning ${parsed.owner}/${parsed.repo}…`);
    const repoPath = await cloneGitHubRepo(parsed, getCloneDirectory(scanId));
    updateScan(scanId, {
      repoPath,
      specFileName: `${parsed.owner}/${parsed.repo}`,
    });

    await setPhase(scanId, "parsing", 12, "Discovering OpenAPI specification…");
    const { content, fileName } = await discoverOpenApiSpec(repoPath);
    updateScan(scanId, { specFileName: fileName });

    await setPhase(scanId, "parsing", 15, `Parsing ${fileName}…`);
    const parsedSpec = parseSpecContent(content, fileName);

    await setPhase(scanId, "mapping", 25, "Mapping API attack surface…");
    const apiGraph = mapApiGraph(parsedSpec);
    updateScan(scanId, { apiGraph });

    await setPhase(scanId, "planning", 45, "AI scan planner selecting checks…");
    const scanPlan = buildScanPlan(apiGraph);
    updateScan(scanId, { scanPlan });

    await setPhase(scanId, "scanning", 65, "Simulating vulnerability probes…");
    const rawFindings = runSimulatedScan(apiGraph, scanPlan);

    await setPhase(scanId, "analyzing", 85, "Analyzing and explaining findings…");
    const findings = analyzeFindings(apiGraph, rawFindings);
    const report = generateReport(apiGraph, findings);

    updateScan(scanId, {
      status: "completed",
      progress: 100,
      message: `Scan complete — ${findings.length} finding(s)`,
      findings,
      report,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    updateScan(scanId, {
      status: "failed",
      progress: 100,
      message,
      error: message,
    });
  }
}

export function createScanJob(repoUrl: string): ScanJob {
  const now = new Date().toISOString();
  const job: ScanJob = {
    id: crypto.randomUUID(),
    status: "pending",
    progress: 0,
    message: "Queued",
    createdAt: now,
    updatedAt: now,
    specFileName: "cloning…",
    repoUrl,
  };
  saveScan(job);
  return job;
}

export function startScan(repoUrl: string): ScanJob {
  const job = createScanJob(repoUrl);
  void runScanPipeline(job.id, repoUrl);
  return getScan(job.id)!;
}
