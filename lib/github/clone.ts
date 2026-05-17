import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import type { ParsedGitHubRepo } from "@/lib/github/parse";

const execFileAsync = promisify(execFile);

function cloneUrlWithAuth(cloneUrl: string): string {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return cloneUrl;
  return cloneUrl.replace("https://", `https://x-access-token:${token}@`);
}

export function getCloneDirectory(scanId: string): string {
  return path.join(process.cwd(), ".repos", scanId);
}

export async function cloneGitHubRepo(
  parsed: ParsedGitHubRepo,
  targetDir: string
): Promise<string> {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(targetDir), { recursive: true });

  const args = ["clone", "--depth", "1"];
  if (parsed.ref) {
    args.push("--branch", parsed.ref);
  }
  args.push(cloneUrlWithAuth(parsed.cloneUrl), targetDir);

  try {
    await execFileAsync("git", args, {
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    const detail =
      err instanceof Error && "stderr" in err
        ? String((err as { stderr?: string }).stderr ?? err.message)
        : err instanceof Error
          ? err.message
          : "git clone failed";

    if (/not found|ENOENT|spawn git/i.test(detail)) {
      throw new Error(
        "git is required to clone repositories. Install Git and ensure it is on your PATH."
      );
    }

    throw new Error(`Failed to clone repository: ${detail.trim()}`);
  }

  return targetDir;
}
