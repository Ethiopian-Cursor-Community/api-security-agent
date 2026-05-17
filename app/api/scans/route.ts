import { listScans } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET() {
  const scans = listScans().map((s) => ({
    id: s.id,
    status: s.status,
    progress: s.progress,
    message: s.message,
    specFileName: s.specFileName,
    createdAt: s.createdAt,
    findingCount: s.findings?.length ?? 0,
    title: s.apiGraph?.title,
  }));
  return NextResponse.json({ scans });
}
