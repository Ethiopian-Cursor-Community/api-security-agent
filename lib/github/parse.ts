const SEGMENT_PATTERN = /^[a-zA-Z0-9._-]+$/;

export interface ParsedGitHubRepo {
  owner: string;
  repo: string;
  ref?: string;
  cloneUrl: string;
  canonicalUrl: string;
}

function validateSegment(value: string, label: string): void {
  if (!SEGMENT_PATTERN.test(value)) {
    throw new Error(`Invalid GitHub ${label}: ${value}`);
  }
}

function stripGitSuffix(name: string): string {
  return name.endsWith(".git") ? name.slice(0, -4) : name;
}

export function parseGitHubRepoUrl(input: string): ParsedGitHubRepo {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("GitHub repository URL is required");
  }

  const sshMatch = trimmed.match(
    /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?\/?$/
  );
  if (sshMatch) {
    const owner = sshMatch[1];
    const repo = stripGitSuffix(sshMatch[2]);
    validateSegment(owner, "owner");
    validateSegment(repo, "repo");
    return {
      owner,
      repo,
      cloneUrl: `https://github.com/${owner}/${repo}.git`,
      canonicalUrl: `https://github.com/${owner}/${repo}`,
    };
  }

  let url: URL;
  try {
    url = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`
    );
  } catch {
    throw new Error("Invalid GitHub repository URL");
  }

  if (url.hostname !== "github.com") {
    throw new Error("Only github.com repository links are supported");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error(
      "Use a repository URL like https://github.com/owner/repo"
    );
  }

  const owner = parts[0];
  const repo = stripGitSuffix(parts[1]);
  validateSegment(owner, "owner");
  validateSegment(repo, "repo");

  let ref: string | undefined;
  if (parts[2] === "tree" && parts[3]) {
    ref = decodeURIComponent(parts[3]);
  }

  return {
    owner,
    repo,
    ref,
    cloneUrl: `https://github.com/${owner}/${repo}.git`,
    canonicalUrl: `https://github.com/${owner}/${repo}`,
  };
}
