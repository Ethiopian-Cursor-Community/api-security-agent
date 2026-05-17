import { parseGitHubRepoUrl } from "@/lib/github/parse";
import { startScan } from "@/lib/scanner/pipeline";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const repoUrl = ((body.repoUrl as string | undefined) ?? "").trim();

    if (!repoUrl) {
      return NextResponse.json(
        { error: "repoUrl is required" },
        { status: 400 }
      );
    }

    parseGitHubRepoUrl(repoUrl);

    const job = startScan(repoUrl);
    return NextResponse.json({ scanId: job.id, job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start scan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
