import { getScan } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getScan(id);

  if (!job) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
