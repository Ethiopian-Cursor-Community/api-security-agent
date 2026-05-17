import { remediateFinding } from "@/lib/remediation/agent";
import { getScan, updateScan } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scanId, findingId } = body as {
      scanId: string;
      findingId: string;
    };

    if (!scanId || !findingId) {
      return NextResponse.json(
        { error: "scanId and findingId are required" },
        { status: 400 }
      );
    }

    const job = getScan(scanId);
    if (!job?.findings) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    if (!job.repoPath) {
      return NextResponse.json(
        { error: "Repository clone is not ready yet. Wait for the scan to finish cloning." },
        { status: 400 }
      );
    }

    const findingIndex = job.findings.findIndex((f) => f.id === findingId);
    if (findingIndex < 0) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    const finding = job.findings[findingIndex];
    updateScan(scanId, {
      findings: job.findings.map((f) =>
        f.id === findingId
          ? { ...f, remediationStatus: "in_progress" }
          : f
      ),
    });

    const patch = await remediateFinding(finding, { repoPath: job.repoPath });

    const updatedFindings = job.findings.map((f) =>
      f.id === findingId
        ? { ...f, remediationStatus: "completed" as const, patch }
        : f
    );

    const updated = updateScan(scanId, { findings: updatedFindings });

    if (updated?.apiGraph && updated.findings) {
      const { generateReport } = await import("@/lib/reports/generator");
      updateScan(scanId, {
        report: generateReport(updated.apiGraph, updated.findings),
      });
    }

    return NextResponse.json({ patch, finding: updatedFindings[findingIndex] });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Remediation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
